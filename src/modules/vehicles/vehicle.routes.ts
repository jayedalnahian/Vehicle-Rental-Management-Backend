import { promises as fs } from 'node:fs';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import type Joi from 'joi';
import db from '../../config/db';
import { upload } from '../../config/multer';
import { requireAuth } from '../../middleware/auth';
import { validateQuery } from '../../middleware/validate';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';
import { VehicleRepository } from './vehicle.repository';
import {
  createVehicleSchema,
  listVehiclesQuerySchema,
  updateVehicleSchema,
} from './vehicle.validation';

const router = Router();

const vehicleRepository = new VehicleRepository(db);
const vehicleService = new VehicleService(vehicleRepository);
const vehicleController = new VehicleController(vehicleService);

function validateVehicleBody(schema: Joi.ObjectSchema): RequestHandler {
  return async (req, res, next) => {
    const { value, error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => undefined);
      }
      res.status(400).json({ errors: error.details.map((detail) => detail.message) });
      return;
    }

    req.body = value;
    next();
  };
}

function requireAtLeastOneChange(): RequestHandler {
  return (req, res, next) => {
    if (Object.keys(req.body).length === 0 && !req.file) {
      res.status(400).json({ errors: ['No fields to update'] });
      return;
    }
    next();
  };
}

router.use(requireAuth);

router.get('/', validateQuery(listVehiclesQuerySchema), vehicleController.list);
router.get('/:id', vehicleController.getById);
router.post(
  '/',
  upload.single('photo'),
  validateVehicleBody(createVehicleSchema),
  vehicleController.create,
);
router.put(
  '/:id',
  upload.single('photo'),
  validateVehicleBody(updateVehicleSchema),
  requireAtLeastOneChange(),
  vehicleController.update,
);
router.delete('/:id', vehicleController.remove);

export default router;