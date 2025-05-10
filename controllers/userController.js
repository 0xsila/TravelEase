const User = require("../models/User");

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    const [targetUser, currentUser, favoriteCount] = await Promise.all([
      User.findById(targetUserId).select("-password").lean(),
      User.findById(currentUserId).select("+favoriteUsers").lean(),
      User.countDocuments({ favoriteUsers: targetUserId }),
    ]);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMyFavorite = currentUser.favoriteUsers?.some(
      (id) => id.toString() === targetUserId
    );

    delete targetUser.favoriteUsers;

    res.status(200).json({
      success: true,
      data: {
        ...targetUser,
        favoriteCount,
        isMyFavorite,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};

// Delete user account
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting account",
      error: error.message,
    });
  }
};

//add to favorite
exports.toggleFavorite = async (req, res, next) => {
  const targetUserId = req.params.id;
  const currentUserId = req.user.id;

  if (targetUserId === currentUserId) {
    return res.status(400).json({ message: "You cannot favorite yourself." });
  }

  try {
    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found." });
    }

    const index = currentUser.favoriteUsers.indexOf(targetUserId);

    if (index > -1) {
      currentUser.favoriteUsers.splice(index, 1);
      await currentUser.save();
      return res
        .status(200)
        .json({ message: "User removed from favorites", favorite: false });
    } else {
      currentUser.favoriteUsers.push(targetUserId);
      await currentUser.save();
      return res
        .status(200)
        .json({ message: "User added to favorites", favorite: true });
    }
  } catch (error) {
    next(error);
  }
};
