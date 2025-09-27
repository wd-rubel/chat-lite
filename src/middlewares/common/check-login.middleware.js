import jwt from "jsonwebtoken";

const checkLogin = (req, res, next) => {
  const cookies =
    Object.keys(req.signedCookies).length > 0 ? req.signedCookies : null;

  if (cookies) {
    try {
      const token = cookies[process.env.COOKIE_NAME];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded;

      // if rendering html page, send user data to locals
      if (res.locals.html) {
        res.locals.loggedInUser = decoded;
      }
      return next();
    } catch (error) {
      // token verify fail
      return handleAuthFail(req, res, next);
    }
  } else {
    // no cookies
    return handleAuthFail(req, res, next);
  }
};

// helper function
function handleAuthFail(req, res, next) {
  if (res.locals.html) {
    req.user = null;
    res.locals.loggedInUser = null;
    res.redirect("/");
  } else {
    return res.status(401).json({
      errors: {
        common: {
          msg: "Authentication failed",
        },
      },
    });
  }
}

const redirectLoggedInUser = (req, res, next) => {
  let cookies =
    Object.keys(req.signedCookies).length > 0 ? req.signedCookies : null;
  if (!cookies) {
    next();
  } else {
    res.redirect("/inbox");
  }
};

export { checkLogin, redirectLoggedInUser };
