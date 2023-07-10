const RoomDto = require("../dtos/room-dto");
const roomService = require("../services/room-service");

class RoomsController {
  async create(req, res) {
    const { topic, roomType } = req.body;
    if (!topic || !roomType)
      return res.status(400).json({ message: "All fields are required" });

    const room = await roomService.create({
      topic,
      roomType,
      ownerId: req.user._id,
    });
    return res.json(new RoomDto(room));
  }

  async index(req, res) {
    const { skip, limit } = req.query;
    console.log(req.query);
    const rooms = await roomService.getAllRooms(["Public"], skip, limit);
    const allRooms = rooms.map((room) => new RoomDto(room));
    return res.json(allRooms);
  }
  async show(req, res) {
    const room = await roomService.getRoom(req.params.roomId);
    return res.json(room);
  }

  async addUser(req, res) {
    console.log("adding");
    const { roomId } = req.params;
    const { userId } = req.body;
    // console.log("removing", userId, roomId);
    roomService.addPerson(roomId, userId);
    // return await roomService.addPerson(roomId, userId);
    res.status(200).send({ message: "added" });
  }

  async removeUser(req, res) {
    const { roomId } = req.params;
    const { userId } = req.body;
    console.log(req.body);
    console.log("removing", roomId, userId);

    roomService.removePerson(roomId, userId);
    // return res.json({ message: "User removed from the room" });

    res.status(200).send({ message: "removed" });
  }
}
module.exports = new RoomsController();
