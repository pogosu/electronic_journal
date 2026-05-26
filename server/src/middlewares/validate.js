import { z } from 'zod';

export function validateBody(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Ошибка валидации',
          details: err.errors.map((e) => e.message),
        });
      }
      next(err);
    }
  };
}
