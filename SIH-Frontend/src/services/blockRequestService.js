import { taskService } from './taskService';

export const blockRequestService = {
  getBlockRequests: (filters) => taskService.getTasks(filters),
  getBlockRequestById: (id) => taskService.getTaskById(id),
  createBlockRequest: (data) => taskService.createTask(data),
  updateBlockRequest: (id, data) => taskService.updateTask(id, data),
  deleteBlockRequest: (id) => taskService.deleteTask(id)
};
