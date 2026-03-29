import Joi from 'joi';
import { CreateSessionRequest, UpdateSessionRequest } from '../types/session/request';

/**
 * We'll create a custom Joi validator for the time slots.
 * But Joi doesn't have a built-in for enum of strings, we can use Joi.string().valid(...)
 */
const timeSlots = ['07:00-09:00', '09:00-11:00', '13:00-15:00', '15:00-17:00'] as const;

export const createSessionSchema = Joi.object<CreateSessionRequest>({
  session_date: Joi.date().iso().required().messages({
    'date.base': 'Ngày học không hợp lệ',
    'any.required': 'Ngày học là bắt buộc'
  }),
  time: Joi.string().valid(...timeSlots).required().messages({
    'any.only': 'Khung giờ không hợp lệ. Các giá trị cho phép: 07:00-09:00, 09:00-11:00, 13:00-15:00, 15:00-17:00',
    'any.required': 'Khung giờ là bắt buộc'
  }),
  roomid: Joi.string().hex().length(24).required().messages({
    'string.hex': 'ID phòng không hợp lệ',
    'string.length': 'ID phòng phải có 24 ký tự hexadecimal',
    'any.required': 'ID phòng là bắt buộc'
  }),
  courseid: Joi.string().hex().length(24).required().messages({
    'string.hex': 'ID khóa học không hợp lệ',
    'string.length': 'ID khóa học phải có 24 ký tự hexadecimal',
    'any.required': 'ID khóa học là bắt buộc'
  }),
  userid: Joi.string().hex().length(24).required().messages({
    'string.hex': 'ID người dùng không hợp lệ',
    'string.length': 'ID người dùng phải có 24 ký tự hexadecimal',
    'any.required': 'ID người dùng là bắt buộc'
  })
});

export const updateSessionSchema = Joi.object<UpdateSessionRequest>({
  session_date: Joi.date().iso().optional().messages({
    'date.base': 'Ngày học không hợp lệ'
  }),
  time: Joi.string().valid(...timeSlots).optional().messages({
    'any.only': 'Khung giờ không hợp lệ. Các giá trị cho phép: 07:00-09:00, 09:00-11:00, 13:00-15:00, 15:00-17:00'
  }),
  roomid: Joi.string().hex().length(24).optional().messages({
    'string.hex': 'ID phòng không hợp lệ',
    'string.length': 'ID phòng phải có 24 ký tự hexadecimal'
  }),
  courseid: Joi.string().hex().length(24).optional().messages({
    'string.hex': 'ID khóa học không hợp lệ',
    'string.length': 'ID khóa học phải có 24 ký tự hexadecimal'
  }),
  userid: Joi.string().hex().length(24).optional().messages({
    'string.hex': 'ID người dùng không hợp lệ',
    'string.length': 'ID người dùng phải có 24 ký tự hexadecimal'
  })
});