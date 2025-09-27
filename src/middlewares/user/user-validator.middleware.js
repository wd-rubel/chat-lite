import createError from "http-errors";
import { check, validationResult } from "express-validator";
import People from "../../models/people.model.js";
import { unlink } from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userValidator = [
  check("name")
    .isLength({ min: 1 })
    .withMessage("Name is required")
    .isAlpha("en-US", { ignore: " -" })
    .withMessage("Name must not contain anything other than alphabet")
    .trim(),
  check("email")
    .isEmail()
    .withMessage("Invalid email address")
    .trim()
    .custom(async (value) => {
      try {
        const people = await People.findOne({ email: value });
        if (people) {
          throw createError("Email is already used");
        }
      } catch (error) {
        throw createError(error.message);
      }
    }),
  check("phone")
    .isMobilePhone("bn-BD", {
      strictMode: true,
    })
    .withMessage("Phone number must be bangladeshi phone number")
    .custom(async (value) => {
      try {
        const people = await People.findOne({ phone: value });
        if (people) {
          throw createError("Phone number is already used");
        }
      } catch (error) {
        throw createError(error.message);
      }
    }),
  check("password")
    .isStrongPassword()
    .withMessage(
      "Passowrd must be 8 character long and contains at least lowercase, uppercase, number and symbol"
    ),
];
const userValidatorHandler = (req, res, next) => {
  const errors = validationResult(req);
  const mappedErrors = errors.mapped();

  if (Object.keys(mappedErrors).length === 0) {
    next();
  } else {
    // remove uplaoded file
    if (req.files.length > 0) {
      const { filename } = req.files[0];
      unlink(`${__dirname}./public/uploads/avatars/`, (err) => {
        if (err) console.log(err);
      });
    }

    // response the errors
    res.status(500).json({
      errors: mappedErrors,
    });
  }
};

export { userValidator, userValidatorHandler };
