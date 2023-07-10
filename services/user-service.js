const UserModel = require("../models/user-model");

class UserService {
  async findUser(filter) {
    const user = await UserModel.findOne(filter);
    return user;
  }

  async followUser(currentUser, userToFollow) {
    if (currentUser.following.includes(userToFollow._id)) {
      return false; // User is already following
    }
    userToFollow.followers.push(currentUser._id);
    currentUser.following.push(userToFollow._id);
    await userToFollow.save();
    await currentUser.save();
    console.log(currentUser, userToFollow);
    return true;
  }

  async unfollowUser(currentUser, userToUnfollow) {
    currentUser.following.pull(userToUnfollow._id);
    userToUnfollow.followers.pull(currentUser._id);
    await currentUser.save();
    await userToUnfollow.save();
    console.log(currentUser, userToUnfollow);
    return true;
  }

  async setBio(desc, userId) {
    try {
      const updatedUser = await UserModel.findOneAndUpdate(
        { _id: userId },
        { bio: desc },
        { new: true }
      );
      console.log(updatedUser);
      return true;
    } catch (error) {
      console.error("Error updating bio:", error);
      return false;
    }
  }

  async createUser(data) {
    const user = await UserModel.create(data);
    return user;
  }
}

module.exports = new UserService();
