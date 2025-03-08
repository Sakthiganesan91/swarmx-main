const express = require("express");
const getuserController = require("../controller/getuserController");
const requireAuth = require("../middleware/authMiddleware");
const routes = express.Router();

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
});

//routes.use(requireAuth);
routes.get("/users/:id", getuserController.getUserById);

const cpUpload = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

routes.put(
  "/users_update/:id",
  cpUpload,

  getuserController.updateuser
);
routes.put(
  "/users_update_social_link/:id",
  getuserController.updateusersociallink
);
routes.get("/check-profile/:id", getuserController.checkProfile);

module.exports = routes;
