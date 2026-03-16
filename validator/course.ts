import Joi from 'joi';
import { CreateCourseRequest, UpdateCourseRequest } from '../types/course/request';

export const createCourseSchema = Joi.object<CreateCourseRequest>({
  courseName: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Tên khóa học phải có ít nhất 3 ký tự',
    'string.max': 'Tên khóa học không được vượt quá 100 ký tự',
    'any.required': 'Tên khóa học là bắt buộc'
  }),
  description: Joi.string().max(1000).optional().allow('').messages({
    'string.max': 'Mô tả không được vượt quá 1000 ký tự'
  })
});

export const updateCourseSchema = Joi.object<UpdateCourseRequest>({
  courseName: Joi.string().min(3).max(100).optional().messages({
    'string.min': 'Tên khóa học phải có ít nhất 3 ký tự',
    'string.max': 'Tên khóa học không được vượt quá 100 ký tự'
  }),
  description: Joi.string().max(1000).optional().allow('').messages({
    'string.max': 'Mô tả không được vượt quá 1000 ký tự'
  })
});