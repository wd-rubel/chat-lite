import createHttpError from "http-errors";

// 404 not found handler
function notFoundHanlder(req, res, next) {
  next(createHttpError(404, "Your requested content was not found!"));
}

// default error handler
function errorHandler(err, req, res, next) {
  if (err) {
    res.locals.title = "Error Page";
    res.locals.error =
      process.env.NODE_ENV === "development" ? err : {message: err.message};

    res.status(err.status || 500);

    if (res.locals.html) {
      res.render("error");
    } else {
      res.json(res.locals.error);
    }
  } else {
    next();
  }
}

export { notFoundHanlder, errorHandler };
