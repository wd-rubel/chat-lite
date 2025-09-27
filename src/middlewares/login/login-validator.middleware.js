import { check, validationResult } from "express-validator";

const loginValidators = [
  check("username")
    .isLength({
      min: 1,
    })
    .withMessage("Phone or Email is required"),
  check("password")
    .isLength({
      min: 1,
    })
    .withMessage("Password is required"),
];

const validationHandler = (req, res, next) => {
  const errors = validationResult(req);
  const mappedErrors = errors.mapped();

  if (Object.keys(mappedErrors).length === 0) {
    // no errors → continue
    return next();
  } else {
    // errors thakle render koro
    return res.render("index", {
      data: req.body.username,
      errors: mappedErrors,
    });
  }
};

export { loginValidators, validationHandler };
