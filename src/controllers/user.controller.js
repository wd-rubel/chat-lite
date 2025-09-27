import bcrypt from "bcrypt";
import User from "../models/people.model.js";
import fs from "fs";
import path from "path";

async function getUsers(req, res, next) {
  try {
    const users = await User.find();
    if (res.locals.html) {
      res.render("users", {
        users: users,
        loggedInUser: req.user
      });
    } else {
      res.status(200).json(users);
    }
  } catch (error) {
    next(error);
  }
}

async function searchUser(req, res, next) {
  try {
    let searchTerm = req.body.user;
    searchTerm = searchTerm.replace("+88", "");
    const users = await User.find({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
        { phone: { $regex: searchTerm, $options: "i" } },
      ],
    }).limit(10);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      errors: {
        common: { msg: "unknown error occured!" },
      },
    });
  }
}

async function addUser(req, res) {
  let newUser;
  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  newUser = new User({
    ...req.body,
    password: hashedPassword,
    avatar: req.files && req.files.length > 0 ? req.files[0].filename : null,
  });

  // save user
  try {
    const result = await newUser.save();
    res.status(201).json({
      message: "user added successfully!",
      userId: result._id,
    });
  } catch (error) {
    console.log("error", error);

    res.status(500).json({
      errors: {
        common: {
          msg: "unknown error occured!",
        },
      },
    });
  }
}

async function deleteUser(req, res, next) {
  try {
    const user = await User.findByIdAndDelete({
      _id: req.params.id,
    });

    // remove avatar
    if (user && user.avatar) {
      let avatarPath = path.join(appRoot, "public", "uploads", "avatars", user.avatar);
      await fs.promises.unlink(avatarPath);
    }

    res.status(200).json({
      message: "User has been deleted successfully!",
    });
  } catch (error) {
    res.status(500).json({
      errors: {
        common: {
          msg: "User can't be deleted!",
        },
      },
    });
  }
}

async function deleteLooggedInUser(req, res, next) {
  try {
    const id = req.user.id;

    const user = await User.findByIdAndDelete(id);

    // remove avatar
    if (user && user.avatar) {
      let avatarPath = path.join(appRoot, "public", "uploads", "avatars", user.avatar);
      await fs.promises.unlink(avatarPath);
    }

    // logout after delete
    res.clearCookie(process.env.COOKIE_NAME);

    res.status(200).json({
      message: "The profile has been deleted successfully!",
      avatar: user.avatar,
    });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({
      errors: {
        common: {
          msg: "Unable to delete profile!",
        },
      },
    });
  }
}

export { getUsers, addUser, deleteUser, deleteLooggedInUser, searchUser };
