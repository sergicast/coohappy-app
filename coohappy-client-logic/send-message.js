require('coohappy-commons/polyfills/string')
const { utils: { Email, call } } = require('coohappy-commons')
const context = require('./context')

/**
 * Add message to cohousing messages.
 * 
 * @param {string} message Chat message. 
 * @param {Object} date - The date of user send the message.
 * 
 * @throws {Error} When api return some error 
 *
 */

module.exports = function(message, date) {

    String.validate.notVoid(message)
    if(typeof date !== 'object') throw TypeError(`${date} is not an object`)

    return (async () => {

        const token = await this.storage.getItem('TOKEN')

       const res = await call('POST',
       `${this.API_URL}/cohousings/message`, 
       JSON.stringify({ message, date }), 
       { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` })
         
                if (res.status === 201) return

                const { error } = JSON.parse(res.body)

                throw new Error(error)
            })()
}.bind(context)