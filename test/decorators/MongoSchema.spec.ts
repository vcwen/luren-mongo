import 'reflect-metadata'
import { Field, MetadataKey, MongoSchema } from '../../src'

describe('MongoSchema', () => {
  it('should build schema with props', () => {
    @MongoSchema()
    class Test {
      @Field()
      public name!: string
      @Field({ type: 'number?' })
      public age?: number
    }
    const metadata = Reflect.getMetadata(MetadataKey.MONGO_SCHEMA, Test.prototype)
    expect(metadata).toEqual(
      expect.objectContaining({
        name: 'Test',
        schema: expect.objectContaining({
          type: 'object',
          classConstructor: expect.any(Function),
          properties: {
            name: expect.objectContaining({
              type: 'string'
            }),
            age: expect.objectContaining({
              type: 'number'
            })
          },
          required: ['name']
        })
      })
    )
  })
})
