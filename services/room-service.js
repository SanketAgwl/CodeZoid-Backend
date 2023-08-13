const RoomModel = require("../models/room-model");
const UserModel = require("../models/user-model");
const roomCache = new Map();

class RoomService {
  async create(payload) {
    const { topic, roomType, ownerId } = payload;
    const room = await RoomModel.create({
      topic,
      roomType,
      ownerId,
      speakers: [ownerId],
    });
    return room;
  }
  async getAllRooms(types, skip, limit) {
    const rooms = await RoomModel.find({ roomType: { $in: types } })
      .populate("speakers")
      .populate("ownerId")
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .exec();
    return rooms;
  }
  async getRoom(roomId, type) {
    const room = await RoomModel.findOne({ _id: roomId });
    return room;
  }

  async addPerson(roomId, userId) {
    console.log(roomId, userId);
    if (roomCache.has(roomId)) {
      const room = roomCache.get(roomId);
      if (!room.users.includes(userId)) {
        room.users.push(userId);
      }
    } else {
      const newRoom = {
        users: [userId],
      };
      roomCache.set(roomId, newRoom);
    }
    console.log(roomCache.get(roomId));
    // Update the cache immediately, then trigger the database update asynchronously
    this.updateRoomInMongoDB(roomId).catch(console.error);
  }

  async removePerson(roomId, userId) {
    if (roomCache.has(roomId)) {
      const room = roomCache.get(roomId);
      room.users = room.users.filter((id) => id !== userId);
    }
    console.log(roomCache.get(roomId));
    // Update the cache immediately, then trigger the database update asynchronously
    this.updateRoomInMongoDB(roomId).catch(console.error);
  }

  async updateRoomInMongoDB(roomId) {
    console.log("Updating Room");
    try {
      const room = roomCache.get(roomId);
      if (!room) {
        return; // Room not found in cache, no need to update MongoDB
      }

      // Check if the room has no users
      if (room.users.length === 0) {
        await RoomModel.findByIdAndDelete(roomId);
        roomCache.delete(roomId); // Remove the room from the cache
        // Optionally, you can handle any post-deletion logic here
        return; // Exit the method after deleting the room
      }

      await RoomModel.findByIdAndUpdate(
        roomId,
        { users: room.users },
        { new: true }
      );
      // Optionally, you can handle any post-update logic or error handling here
    } catch (error) {
      // Handle error
      console.error(error);
    }
    console.log("Room Updated");
  }
}

module.exports = new RoomService();
