const express = require("express")
const router = express.Router()
const usersController = require("../controllers/usersController")
const verifyJWT = require("../middleware/verifyJWT")

// router.use(verifyJWT)
router
  .route("/")
  .get(usersController.getAllUsers) //read
  .post(usersController.createNewUser) //create
  .patch(usersController.updateUser) //update

router.delete("/:id", usersController.deleteUser) //delete

module.exports = router
