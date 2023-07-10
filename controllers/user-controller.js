const UserDto = require("../dtos/user-dto");
const userService = require("../services/user-service");

class UserController {
  async getUser(req, res) {
    const { userId } = req.params;
    console.log(userId);
    const user = await userService.findUser({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const userDto = new UserDto(user);
    console.log(userDto);
    return res.json({ user: userDto });
  }

  async followUser(req, res) {
    const { userId } = req.params;
    const { user } = req;
    try {
      const userToFollow = await userService.findUser({ _id: userId });
      const curUser = await userService.findUser({ _id: user._id });
      if (!userToFollow) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!curUser) {
        return res.status(404).json({ message: "User not found" });
      }
      console.log(curUser, userToFollow);
      const success = await userService.followUser(curUser, userToFollow);
      if (!success) {
        return res
          .status(400)
          .json({ message: "You are already following this user" });
      }
      return res.status(200).json({ message: "User followed successfully" });
    } catch (error) {
      console.error("Error following user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async unfollowUser(req, res) {
    const { userId } = req.params;
    const { user } = req;
    const userToUnfollow = await userService.findUser({ _id: userId });
    const curUser = await userService.findUser({ _id: user._id });
    console.log("unfollowing", curUser, userToUnfollow);
    if (!userToUnfollow) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!curUser) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      await userService.unfollowUser(curUser, userToUnfollow);
      return res.json({ message: "Unfollowed successfully" });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
  async changeBio(req, res) {
    console.log("adding description");
    const { desc } = req.body;
    const { user } = req;
    const userId = user._id;

    try {
      await userService.setBio(desc, userId);
      return res.status(200).json({ message: "Description Changed" });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new UserController();
