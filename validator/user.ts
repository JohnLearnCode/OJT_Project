import Joi from 'joi';
import { CreateTeacherRequest, UpdateTeacherRequest } from '../types/user/request';

export const createTeacherSchema = Joi.object<CreateTeacherRequest>({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email là bắt buộc'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
    'any.required': 'Mật khẩu là bắt buộc'
  }),
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Tên phải có ít nhất 2 ký tự',
    'string.max': 'Tên không được vượt quá 50 ký tự',
    'any.required': 'Tên là bắt buộc'
  }),
  phoneNumber: Joi.string().pattern(/^[0-9]{10,11}$/).allow(null, '').optional().messages({
    'string.pattern.base': 'Số điện thoại không hợp lệ (phải có 10-11 chữ số)'
  })
});

export const updateTeacherSchema = Joi.object<UpdateTeacherRequest>({
  email: Joi.string().email().optional().messages({
    'string.email': 'Email không hợp lệ'
  }),
  name: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'Tên phải có ít nhất 2 ký tự',
    'string.max': 'Tên không được vượt quá 50 ký tự'
  }),
  phoneNumber: Joi.string().pattern(/^[0-9]{10,11}$/).allow(null, '').optional().messages({
    'string.pattern.base': 'Số điện thoại không hợp lệ (phải có 10-11 chữ số)'
  })
});