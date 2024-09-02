const Note = require("../models/Note")
const User = require("../models/User")
const asyncHandler = require("express-async-handler")

//@desc Get all users
//@route GET /users
//@access Private
const getAllNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find().lean()
  if (!notes?.length) {
    return res.status(400).json({ message: "NO NOTES YET" })
  }

  // Add username to each note before sending the response
  const notesWithUser = await Promise.all(
    notes.map(async (note) => {
      const user = await User.findById(note.user).lean().exec()
      return { ...note, username: user.username }
    })
  )

  res.json(notesWithUser)
})

//@desc CREATE new note
//@route CREATE /note
//@access Private
const createNewNote = asyncHandler(async (req, res) => {
  const { user, title, text } = req.body
  //confirm data
  if (!user || !title || !text) {
    return res.status(400).json({ message: "ALL FIELDS ARE REQUIRED" })
  }

  //duplicates
  const duplicate = await Note.findOne({ title })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec()
  if (duplicate) {
    return res.status(400).json({ message: "DUPLICATE NOTE" })
  }
  //new note
  const note = await Note.create({ user, title, text })
  if (note) {
    //created
    return res.status(201).json({ message: "New note created" })
  } else {
    return res.status(400).json({ message: "Invalid note received" })
  }
})

//@desc UPDATE a user
//@route UPDATE /user
//@access Private
const updateNote = asyncHandler(async (req, res) => {
  const { id, user, title, text, completed } = req.body

  //confirm data
  if (!id || !user || !title || !text || typeof completed !== "boolean") {
    return res.status(400).json({ message: "All fields are required" })
  }
  //confirm note exists
  const note = await Note.findById(id).exec()
  if (!note) {
    return res.status(400).json({ message: "Note not found" })
  }
  //check for dupliactes
  const duplicate = await Note.findOne({ title })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec()
  //retain the og note if duplicate is checked
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate note title" })
  }
  note.user = user
  note.title = title
  note.text = text
  note.completed = completed

  const updatedNote = await note.save()
  res.json(`${updatedNote.title} updated`)
})

//@desc DELETE a user
//@route DELETE /user
//@access Private
const deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.body

  //confirm data
  if (!id) {
    return res.status(400).json({ message: "USER ID REQUIRED" })
  }

  //confirm note exists
  const note = await Note.findById(id).exec()

  if (!note) {
    return res.status(400).json({ message: "Note not found" })
  }

  const result = note
  await note.deleteOne()
  const reply = `${result.title} note with id ${result.id} deleted`

  res.json(reply)
})

module.exports = { getAllNotes, createNewNote, updateNote, deleteNote }
