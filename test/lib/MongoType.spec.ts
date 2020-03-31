import { AnyMongoType } from '../../src/lib/MongoType'

describe('AnyMongoType', () => {
  describe('toBsonSchema', () => {
    it('should generate bson schema', () => {
      const bsonSchema = new AnyMongoType().toBsonSchema({ type: 'any' })
      expect(bsonSchema).toEqual({})
    })
  })
})
// describe('StringMongoType', () => {})
// describe('BooleanMongoType', () => {})
// describe('NumberMongoType', () => {})
// describe('IntegerMongoType', () => {})
// describe('DateMongoType', () => {})
// describe('ArrayMongoType', () => {})
// describe('ObjectMongoType', () => {})
// describe('ObjectIdMongoType', () => {})
