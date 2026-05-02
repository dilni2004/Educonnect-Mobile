const mongoose = require('mongoose');

const knowledgeBasePolicySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a policy name'],
    trim: true,
    unique: true,
    maxlength: 120,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  rules: {
    type: String,
    default: '',
    trim: true,
  },
  icon: {
    type: String,
    default: '',
    trim: true,
    maxlength: 64,
  },
}, { timestamps: true });

module.exports = mongoose.model('KnowledgeBasePolicy', knowledgeBasePolicySchema);
