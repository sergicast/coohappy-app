require('dotenv').config()

const { env: { TEST_MONGODB_URL: MONGODB_URL, JWT_SECRET } } = process

const { expect } = require('chai')
const { random } = Math
const retrieveUserFoodList = require('./retrieve-user-food-list')
const bcrypt = require('bcryptjs')

const jwtPromised = require('jsonwebtoken')
global.fetch = require('node-fetch')
const notAsyncStorage = require('not-async-storage')
const logic = require('.')

const { utils: { randomAccessCode } } = require('coohappy-commons')
const { mongoose } = require('coohappy-data')
const { errors: { VoidError } } = require('coohappy-commons')
const { models: { User, Cohousing }, mongoose: { ObjectId } } = require('coohappy-data')

let name, surname, email, password, hash, userId, nameCohousing, street, number, city, accessCode, message, date, foodItem, foodItem_2, _name, _surname, _email, _password, _hash, laundryNum

describe('logic - retrieve-all-user-food-list', () => {

    before(() => mongoose.connect(MONGODB_URL))

    beforeEach(async () => {

        await User.deleteMany()
        await Cohousing.deleteMany()

        name = `name-${random()}`
        surname = `surname-${random()}`
        email = `e-${random()}@mail.com`
        password = `password-${random()}`

        _name = `name-${random()}`
        _surname = `surname-${random()}`
        _email = `e-${random()}@mail.com`
        _password = `password-${random()}`

        nameCohousing = `name-${random()}`
        street = `street-${random()}`
        number = random()
        city = `city-${random()}`
        accessCode = randomAccessCode(name)
        laundryNum = 4

        foodItem = `fruit-${random()}`
        foodItem_2 = `fruit-${random()}`


        hash = await bcrypt.hash(password, 10)
        _hash = await bcrypt.hash(password, 10)
        const user = await User.create({ name, surname, email, password: hash })
        userId = user.id
        const token = await jwtPromised.sign({ sub: userId }, JWT_SECRET)
        await logic.__context__.storage.setItem('TOKEN', token)

        let address = { street, number, city }
        await Cohousing.create({ name: nameCohousing, address, author: userId, accessCode, members: [userId], laundryNum })

        user.foodList.push({ name: foodItem, weight: 2 })
        user.foodList.push({ name: foodItem_2, weight: 1 })
        await user.save()
    })

    describe('when user have a list', () => {

        it('should show user list food', async () => {

            const list = await retrieveUserFoodList()

            expect(list.foodList).to.exist
            expect(list.foodList[0].name).to.equal(foodItem)
            expect(list.foodList[0].weight).to.equal(2)

            expect(list.foodList[1].name).to.equal(foodItem_2)
            expect(list.foodList[1].weight).to.equal(1)
        })
    })


    describe('when user has not a list', () => {
        let _user, _userId
        beforeEach(async () => {

            _user = await User.create({ name: _name, surname: _surname, email: _email, password: _hash })
            _userId = _user.id
            const token = await jwtPromised.sign({ sub: _userId }, JWT_SECRET)
            await logic.__context__.storage.setItem('TOKEN', token)

        })
        it('should not show nothing', async () => {
            try {

                await retrieveUserFoodList()

            } catch (error) {
                expect(error).to.exist
                expect(error.message).to.equal(`no list yet`)
            }
        })
    })

    afterEach(() => User.deleteMany())

    after(mongoose.disconnect)

})