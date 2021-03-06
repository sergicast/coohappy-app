const { Schema, SchemaTypes: { ObjectId } } = require('mongoose')
const message = require('./message')


module.exports = new Schema({
    author: {
        type: ObjectId,
        ref: 'User',
        required: true
    },

    name: {
        type: String,
        required: true,
        unique: true
    },

    address: {
        type: {

            street: {
                type: String,
                required: true
            },

            number: {
                type: Number,
                required: true
            },

            city: {
                type: String,
                required: true
            },
            country: {
                type: String,
                required: true
            }
        },
        require: true
    },

    members: [{
        type: ObjectId,
        ref: 'User',
        required: true
    }],

    accessCode: {
        type: String,
        required: true
    },

    foodList: [{
        name: {

            type: String,
            required: true

        },

        weight: {
            type: Number,
            required: true
        }
    }],

    messages: [message],

    laundry: [{

        day: {

            type: String
        },

        hour: {
            type: String
        },

        user: {
            type: ObjectId,
            ref: 'User'
        }
    }],
    laundryNum: {
        type: Number,
        required: true
    }
})


