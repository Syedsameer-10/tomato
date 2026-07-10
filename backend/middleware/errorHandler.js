export const errorHandler = (error, req, res, next) => {
  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Image is too large. Please upload a smaller image.",
    });
  }

  return next(error);
};
