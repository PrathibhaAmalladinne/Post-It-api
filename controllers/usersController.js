// const User = require('../models/User')
const User = require("../models/User")
const Note = require("../models/Note")
const asyncHandler = require("express-async-handler")
const bcrypt = require("bcrypt")

//@desc Get all users
//@route GET /users
//@access Private
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").lean()
  if (!users?.length) {
    return res.status(400).json({ message: "NO USERS FOUND" })
  }
  res.json(users)
})

//@desc Create new user
//@route POST /users
//@access Private
const createNewUser = asyncHandler(async (req, res) => {
  const { username, password, roles } = req.body

  //confirm data
  if (!username || !password || !Array.isArray(roles) || !roles.length) {
    return res.status(400).json({ message: "All fields are required" })
  }

  //check for duplicates
  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec()
  if (duplicate) {
    return res.status(400).json({ message: "Duplicate username" })
  }

  //hash password
  const hashedPassword = await bcrypt.hash(password, 10) //salt rounds
  const userObject = { username, password: hashedPassword, roles }

  const user = await User.create(userObject)

  if (user) {
    //created
    res.status(201).json({ message: `New user ${username} created`, user })
  } else {
    res.status(400).json({ message: "Invalid user data received" })
  }
})

//@desc Update a user
//@route PATCH /users
//@access Private
const updateUser = asyncHandler(async (req, res) => {
  const { id, username, roles, active, password } = req.body

  //confirm data
  if (
    !id ||
    !username ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== "boolean"
  ) {
    return res.status(400).json({ message: "ALL FIELDS ARE REQUIRED" })
  }
  const user = await User.findById(id).exec()
  if (!user) {
    return res.status(400).json({ message: "USER NOT FOUND" })
  }

  //DUPLICATE
  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec()
  //allow updates to the og
  if (duplicate && duplicate?.id.toString() !== id) {
    return res.status(409).json({ message: "DUPLICATE USERNAME" })
  }
  user.username = username
  user.roles = roles
  user.active = active
  if (password) {
    //hash
    user.password = await bcrypt.hash(password, 10)
  }
  const updatedUser = await user.save()
  res.json({ message: `User ${updatedUser.username} updated` })
})

//@desc Delete user
//@route DELETE /users
//@access Private
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body

  if (!id) {
    return res.status(400).json({ message: "USER ID REQUIRED" })
  }

  const note = await Note.findOne({ user: id }).lean().exec()
  if (note) {
    return res.status(400).json({ message: "USER HAS ASSIGNED NOTES" })
  }

  const user = await User.findById(id).exec()

  if (!user) {
    return res.status(400).json({ message: "USER NOT FOUND" })
  }
  const result = user
  await user.deleteOne()
  const reply = `USERNAME ${result.username} WITH ID ${result.id} DELETED`
  res.json(reply)
})

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
}
