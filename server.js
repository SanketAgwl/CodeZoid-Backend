require("dotenv").config();
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const DbConnect = require("./database");
const router = require("./routes");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const ACTIONS = require("./actions");

const io = require("socket.io")(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
  allowEIO3: true, // Enable credentials
});

app.use(cookieParser());
const corsOption = {
  credentials: true,
  origin: [process.env.CLIENT_URL, "http://localhost:3000"],
};
app.use(cors(corsOption));
app.use("/storage", express.static("storage"));

const PORT = process.env.PORT || 5500;
DbConnect();
app.use(express.json({ limit: "8mb" }));
app.use(router);

app.get("/", (req, res) => {
  res.send("Hello from express Js");
});

console.log("CLIENT_URL:", process.env.CLIENT_URL);

// Sockets
const socketUserMap = {};

io.on("connection", (socket) => {
  console.log("New connection", socket.id);
  socket.on(ACTIONS.JOIN, async ({ roomId, user }) => {
    socketUserMap[socket.id] = user;

    // console.log('Map', socketUserMap);

    // get all the clients from io adapter
    // console.log('joining');
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    // console.log('All connected clients', clients, io.sockets.adapter.rooms);
    // Add peers and offers and all

    clients.forEach((clientId) => {
      io.to(clientId).emit(ACTIONS.ADD_PEER, {
        peerId: socket.id,
        createOffer: false,
        user,
      });

      // Send myself as well that much msgs how many clients

      socket.emit(ACTIONS.ADD_PEER, {
        peerId: clientId,
        createOffer: true,
        user: socketUserMap[clientId],
      });
    });

    // Join the room
    socket.join(roomId);
  });

  // Handle Relay Ice event
  socket.on(ACTIONS.RELAY_ICE, ({ peerId, icecandidate }) => {
    io.to(peerId).emit(ACTIONS.ICE_CANDIDATE, {
      peerId: socket.id,
      icecandidate,
    });
  });

  // Handle Relay SDP
  socket.on(ACTIONS.RELAY_SDP, ({ peerId, sessionDescription }) => {
    io.to(peerId).emit(ACTIONS.SESSION_DESCRIPTION, {
      peerId: socket.id,
      sessionDescription,
    });
  });

  socket.on(ACTIONS.MUTE, ({ roomId, userId }) => {
    console.log("mute on server", userId);
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    clients.forEach((clientId) => {
      io.to(clientId).emit(ACTIONS.MUTE, {
        peerId: socket.id,
        userId,
      });
    });
  });

  socket.on(ACTIONS.UNMUTE, ({ roomId, userId }) => {
    console.log("unmute on server", userId);
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    clients.forEach((clientId) => {
      io.to(clientId).emit(ACTIONS.UNMUTE, {
        peerId: socket.id,
        userId,
      });
    });
  });

  const leaveRoom = async () => {
    const { rooms } = socket;
    console.log("leaving", rooms);

    await Promise.all(
      Array.from(rooms).map(async (roomId) => {
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

        await Promise.all(
          clients.map(async (clientId) => {
            io.to(clientId).emit(ACTIONS.REMOVE_PEER, {
              peerId: socket.id,
              userId: socketUserMap[socket.id]?.id,
            });

            socket.emit(ACTIONS.REMOVE_PEER, {
              peerId: clientId,
              userId: socketUserMap[clientId]?.id,
            });

            await new Promise((resolve) => {
              socket.leave(roomId, () => {
                resolve();
              });
            });
          })
        );
      })
    );

    delete socketUserMap[socket.id];

    console.log("map", socketUserMap);
  };

  socket.on(ACTIONS.LEAVE, leaveRoom);

  socket.on("disconnecting", leaveRoom);
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
