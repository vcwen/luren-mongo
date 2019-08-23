import { Prop } from 'luren-schema'
import 'reflect-metadata'
import { Field, MetadataKey, MongoSchema, NotField } from '../../src'

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
    expect(metadata).toEqual({
      name: 'Test',
      schema: {
        type: 'object',
        classConstructor: expect.any(Function),
        properties: {
          name: {
            type: 'string'
          },
          age: {
            type: 'number'
          }
        },
        required: ['name']
      }
    })
  })
  it('should build schema with options', () => {
    // tslint:disable-next-line: max-classes-per-file
    @MongoSchema({ additionalProps: true, description: 'test class' })
    class Test {}
    const metadata = Reflect.getMetadata(MetadataKey.MONGO_SCHEMA, Test.prototype)
    expect(metadata).toEqual({
      name: 'Test',
      schema: {
        type: 'object',
        additionalProperties: true,
        classConstructor: expect.any(Function),
        description: 'test class'
      }
    })
  })
  it('should use js schema props as fields when useJsSchema is set', () => {
    // tslint:disable-next-line: max-classes-per-file
    @MongoSchema({ useJsSchema: true })
    class Test {
      @Prop()
      public name!: string
      @Prop({ type: 'number?' })
      public age?: number
      @Prop()
      @NotField()
      public foo!: string
    }
    const metadata = Reflect.getMetadata(MetadataKey.MONGO_SCHEMA, Test.prototype)
    expect(metadata).toEqual({
      name: 'Test',
      schema: {
        type: 'object',
        classConstructor: Test,
        properties: {
          name: {
            type: 'string'
          },
          age: {
            type: 'number'
          }
        },
        required: ['name']
      }
    })

    // tslint:disable-next-line: max-classes-per-file
    @MongoSchema({ useJsSchema: true })
    class Foo {}
    const metadata2 = Reflect.getMetadata(MetadataKey.MONGO_SCHEMA, Foo.prototype)
    expect(metadata2).toEqual({
      name: 'Foo',
      schema: {
        type: 'object',
        classConstructor: Foo
      }
    })
  })
})
