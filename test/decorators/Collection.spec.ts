import 'reflect-metadata'
import { Collection, Field, MetadataKey } from '../../src'
describe('Schema', () => {
  it('should build schema with props', () => {
    @Collection()
    class Test {
      @Field()
      public name!: string
      @Field({ type: 'number?' })
      public age?: number
    }
    const metadata = Reflect.getOwnMetadata(MetadataKey.COLLECTION, Test.prototype)
    expect(metadata).toEqual(
      expect.objectContaining({
        name: 'Test'
      })
    )
    const mongoSchemaMetadata = Reflect.getOwnMetadata(MetadataKey.MONGO_SCHEMA, Test.prototype)
    expect(mongoSchemaMetadata).toEqual(
      expect.objectContaining({
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
