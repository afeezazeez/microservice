import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/permission.middleware';
import { validateBody } from '../middlewares/request-validator';
import { CreateTaskDto } from '../dtos/task/create-task.dto';
import { UpdateTaskDto } from '../dtos/task/update-task.dto';

const router = Router();
const taskController = new TaskController();

router.use(authMiddleware);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - title
 *             properties:
 *               project_id:
 *                 type: integer
 *                 example: 1
 *               title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *                 example: "Complete feature implementation"
 *               description:
 *                 type: string
 *                 example: "Task description"
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, DONE, BLOCKED]
 *                 example: "TODO"
 *               assigned_to:
 *                 type: integer
 *                 example: 2
 *               due_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-31T23:59:59Z"
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', requirePermission('task:create'), validateBody(CreateTaskDto), taskController.createTask);

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           default: 25
 *         description: Items per page
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort direction
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', requirePermission('task:view'), taskController.getTasks);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', requirePermission('task:view'), taskController.getTask);

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, DONE, BLOCKED]
 *               assigned_to:
 *                 type: integer
 *               due_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Validation error or invalid status transition
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', requirePermission('task:edit'), validateBody(UpdateTaskDto), taskController.updateTask);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', requirePermission('task:delete'), taskController.deleteTask);

/**
 * @swagger
 * /tasks/{id}/watch:
 *   post:
 *     summary: Start watching a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Started watching task
 *       404:
 *         description: Task not found
 *       409:
 *         description: Already watching this task
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/watch', requirePermission('task:view'), taskController.startWatching);

/**
 * @swagger
 * /tasks/{id}/watch:
 *   delete:
 *     summary: Stop watching a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Stopped watching task
 *       404:
 *         description: Task not found or not watching
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id/watch', requirePermission('task:view'), taskController.stopWatching);

/**
 * @swagger
 * /tasks/{id}/watchers:
 *   get:
 *     summary: Get all watchers for a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Watchers retrieved successfully
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/watchers', requirePermission('task:view'), taskController.getWatchers);

/**
 * @swagger
 * /tasks/{id}/files:
 *   get:
 *     summary: Get all files for a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Files retrieved successfully
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/files', requirePermission('task:view'), taskController.getFiles);

export default router;

