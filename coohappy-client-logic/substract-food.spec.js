require('dotenv').config()

const { env: { TEST_MONGODB_URL: MONGODB_URL, JWT_SECRET } } = process

const { expect } = require('chai')
const { random } = Math
const substractFood = require('./substract-food')
const bcrypt = require('bcryptjs')

const jwtPromised = require('jsonwebtoken')
global.fetch = require('node-fetch')
const notAsyncStorage = require('not-async-storage')
const logic = require('.')
const atob = require('atob')


const { utils: { randomAccessCode } } = require('coohappy-commons')
const { mongoose } = require('coohappy-data')
const { errors: { VoidError } } = require('coohappy-commons')
const { mongoose: { ObjectId }, models: { User, Cohousing } } = require('coohappy-data')

let name, surname, email, password, hash, userId, nameCohousing, street, number, city, accessCode, message, date, foodItem, foodItem_2, laundryNum

describe('logic - substract-food', () => {

    before(() => mongoose.connect(MONGODB_URL))

    beforeEach(async () => {

        await User.deleteMany()
        await Cohousing.deleteMany()

        name = `name-${random()}`
        surname = `surname-${random()}`
        email = `e-${random()}@mail.com`
        password = `password-${random()}`

        nameCohousing = `name-${random()}`
        street = `street-${random()}`
        number = random()
        city = `city-${random()}`
        accessCode = randomAccessCode(name)
        laundryNum = 4

        foodItem = `fruit-${random()}`
        foodItem_2 = `fruit-${random()}`


        hash = await bcrypt.hash(password, 10)
        const user = await User.create({ name, surname, email, password: hash })
        userId = user.id
        const token = await jwtPromised.sign({ sub: userId }, JWT_SECRET)
        await logic.__context__.storage.setItem('TOKEN', token)
        let address = { street, number, city }
        await Cohousing.create({ name: nameCohousing, address, author: userId, accessCode, members: [userId], laundryNum })

        const cohousing = await Cohousing.findOne({ members: userId })
        cohousing.foodList.push({ name: foodItem, weight: 2 })
        await cohousing.save()

        user.foodList.push({ name: foodItem, weight: 2 })
        await user.save()
    })

    describe('when food exist into the list', () => {

        it('should success on substract food item', async () => {

            await substractFood(foodItem)
            const cohousing = await Cohousing.findOne({ members: userId })
            const user = await User.findById(userId)
            expect(user.foodList).to.exist
            expect(user.foodList[0].name).to.equal(foodItem)
            expect(user.foodList[0].weight).to.equal(1.5)
            expect(cohousing.foodList).to.exist
            expect(cohousing.foodList[0].name).to.equal(foodItem)
            expect(cohousing.foodList[0].weight).to.equal(1.5)
        })
        it('should delete on substract all weight food item', async () => {


            await substractFood(foodItem)
            let cohousing = await Cohousing.findOne({ members: userId })
            let user = await User.findById(userId)
            expect(user.foodList).to.exist
            expect(user.foodList[0].name).to.equal(foodItem)
            expect(user.foodList[0].weight).to.equal(1.5)
            expect(cohousing.foodList).to.exist
            expect(cohousing.foodList[0].name).to.equal(foodItem)
            expect(cohousing.foodList[0].weight).to.equal(1.5)

            await substractFood(foodItem)
            cohousing = await Cohousing.findOne({ members: userId })
            user = await User.findById(userId)
            expect(user.foodList).to.exist
            expect(user.foodList[0].name).to.equal(foodItem)
            expect(user.foodList[0].weight).to.equal(1)
            expect(cohousing.foodList).to.exist
            expect(cohousing.foodList[0].name).to.equal(foodItem)
            expect(cohousing.foodList[0].weight).to.equal(1)

            await substractFood(foodItem)
            cohousing = await Cohousing.findOne({ members: userId })
            user = await User.findById(userId)
            expect(user.foodList).to.exist
            expect(user.foodList[0].name).to.equal(foodItem)
            expect(user.foodList[0].weight).to.equal(0.5)
            expect(cohousing.foodList).to.exist
            expect(cohousing.foodList[0].name).to.equal(foodItem)
            expect(cohousing.foodList[0].weight).to.equal(0.5)

            await substractFood(foodItem)
            cohousing = await Cohousing.findOne({ members: userId })
            user = await User.findById(userId)
            expect(user.foodList.length).to.equal(0)


        })
    })


    describe('when food does not exist into the list', () => {


        it('should not change anything', async () => {
            try {

                await substractFood(foodItem_2)
            } catch (error) {
                expect(error).to.exist
                expect(error.message).to.equal(`you can not substract ${foodItem_2}, you still don't have it on the list`)
            }
        })
    })


    describe('sync errors', () => {

        it('on wrong type of data', () => {

            expect(() => substractFood(true)).to.throw(TypeError, 'true is not a string')
        
        })
    })


    afterEach(() => User.deleteMany())

    after(mongoose.disconnect)

})