import { Router } from 'express';
import db from '../../config/db';
import { requireAuth } from '../../middleware/auth';
import { validate, validateQuery } from '../../middleware/validate';
import { RentalController } from './rental.controller';
import { RentalService } from './rental.service';
import { RentalRepository } from './rental.repository';
import {
  createRentalSchema,
  listRentalsQuerySchema,
  updateRentalSchema,
} from './rental.validation';

const router = Router();

const rentalRepository = new RentalRepository(db);
const rentalService = new RentalService(rentalRepository);
const rentalController = new RentalController(rentalService);

router.use(requireAuth);

router.get('/', validateQuery(listRentalsQuerySchema), rentalController.list);
router.get('/:id', rentalController.getById);
router.post('/', validate(createRentalSchema), rentalController.create);
router.put('/:id', validate(updateRentalSchema), rentalController.update);
router.delete('/:id', rentalController.cancel);

export default router;
