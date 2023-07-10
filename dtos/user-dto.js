class UserDto {
  id;
  phone;
  activated;
  createdAt;
  name;
  avatar;
  bio;
  followers;
  following;

  constructor(user) {
    this.id = user?._id;
    this.name = user?.name;
    this.avatar = user?.avatar;
    this.phone = user?.phone;
    this.createdAt = user?.createdAt;
    this.activated = user?.activated;
    this.bio = user?.bio;
    this.followers = user.followers;
    this.following = user.following;
  }
}

module.exports = UserDto;
