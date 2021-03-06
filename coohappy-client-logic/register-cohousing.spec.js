require('dotenv').config()

const { env: { TEST_MONGODB_URL: MONGODB_URL, JWT_SECRET } } = process

const jwtPromised = require('jsonwebtoken')
global.fetch = require('node-fetch')
const notAsyncStorage = require('not-async-storage')
const logic = require('.')
const atob = require('atob')

const registerCohousing = require('./register-cohousing')
const { random } = Math
const { expect } = require('chai')
const { mongoose, models: { User, Cohousing } } = require('coohappy-data')
const bcrypt = require('bcryptjs')


describe('logic - register cohousing', () => {
    before(() => mongoose.connect(MONGODB_URL))

    let name, surname, email, password, userId, hash, street, number, city, userRole, laundryNum, token

    beforeEach(() =>
        Promise.all(
            [User.deleteMany(),
            Cohousing.deleteMany()
            ])

            .then(() => {
                name = `name-${random()}`
                surname = `surname-${random()}`
                email = `email-@${random()}.com`
                password = `password-${random()}`
                country = `country.${random()}`
                nameCohousing = `name-${random()}`
                street = `street-${random()}`
                number = random()
                city = `city-${random()}`
                laundryNum = 4

                return bcrypt.hash(password, 10)
            })
            .then(_hash => hash = _hash)
            .then(() =>
                User.create({ name, surname, email, password: hash })
            )
            .then(user => { userId = user.id })
            .then(() => jwtPromised.sign({ sub: userId }, JWT_SECRET))
            .then(token => logic.__context__.storage.setItem('TOKEN', token))

    )

    describe('when user does not create any coohousing', () => {

        it('should succeed on valid data', () =>

            registerCohousing(nameCohousing, { street, number, city, country }, laundryNum)
                .then(() => Cohousing.findOne({ author: userId }))
                .then(cohousing => {
                    expect(cohousing).to.exist
                    expect(cohousing.author.toString()).to.equal(userId.toString())
                    expect(cohousing.name.toString()).to.equal(nameCohousing)
                    expect(cohousing.address.street.toString()).to.equal(street)
                    expect(cohousing.address.city.toString()).to.equal(city)
                    return User.findById(userId)
                        .then((user) => {
                            expect(user.role).to.equal('admin')
                            expect(user.cohousing).to.exist
                            expect(user.cohousing.toString()).to.equal(cohousing._id.toString())
                        })
                })
        )
    })

    describe('when user already create any coohousing', () => {

        it('should succeed on valid data', () =>

            registerCohousing(nameCohousing, { street, number, city, country }, laundryNum)
                .then(() => registerCohousing(nameCohousing, { street, number, city, country }, laundryNum))

                .catch(error => {
                    expect(error).to.be.an.instanceOf(Error)
                    expect(error.message).to.equal(`user: ${name} ${surname} already belongs to a cohousing`)
                })
        )
    })

    describe('when user already create any coohousing', () => {

        it('should throw an error when user already creates an cohousing', () =>

            registerCohousing(nameCohousing, { street, number, city, country }, laundryNum)
                .then(() => registerCohousing(nameCohousing, { street, number, city, country }, laundryNum))

                .catch(error => {
                    expect(error).to.be.an.instanceOf(Error)
                    expect(error.message).to.equal(`user: ${name} ${surname} already belongs to a cohousing`)
                })
        )
    })

    describe('when user does not exist', () => {

        beforeEach(() => User.deleteMany())
        it('should throw an error when user does not exist', async () => {
            try {
                await registerCohousing(nameCohousing, { street, number, city, country}, laundryNum)
                throw new Error('should not reach this point')

            } catch (error) {

                expect(error).to.be.an.instanceOf(Error)
                expect(error.message).to.equal(`user does not exists`)
            }
        })
    })
    describe('sync errors', () => {
        it('should throw error on wrong data', () => {

            expect(() => registerCohousing(2, { street, number, city, country }, laundryNum)).to.throw(Error, '2 is not a string')
            expect(() => registerCohousing(nameCohousing, name, laundryNum)).to.throw(TypeError, `undefined is not a string`)
 

        })
    })


    afterEach(() => Promise.all([User.deleteMany(), Cohousing.deleteMany()]))

    after(mongoose.disconnect)
})