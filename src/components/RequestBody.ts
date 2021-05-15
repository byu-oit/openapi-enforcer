import { OASComponent, initializeData, SchemaObject, SpecMap, Version, ValidateResult } from './'
import { yes } from '../util'
import * as MediaType from './MediaType'

export interface Definition {
  [extension: string]: any
  description?: string
  content: MediaType.Definition
  required?: boolean
}

export class RequestBody extends OASComponent {
  readonly [extension: string]: any
  description?: string
  content!: MediaType.MediaType
  required?: boolean

  constructor (definition: Definition, version?: Version) {
    const data = initializeData('constructing RequestBody object', definition, version, arguments[2])
    super(data)
  }

  static get spec (): SpecMap {
    return {
      '3.0.0': 'http://spec.openapis.org/oas/v3.0.0#request-body-object',
      '3.0.1': 'http://spec.openapis.org/oas/v3.0.1#request-body-object',
      '3.0.2': 'http://spec.openapis.org/oas/v3.0.2#request-body-object',
      '3.0.3': 'http://spec.openapis.org/oas/v3.0.3#request-body-object'
    }
  }

  static schemaGenerator (): SchemaObject {
    return {
      type: 'object',
      allowsSchemaExtensions: yes,
      properties: [
        {
          name: 'description',
          schema: { type: 'string' }
        },
        {
          name: 'content',
          required: yes,
          schema: {
            type: 'object',
            allowsSchemaExtensions: yes,
            additionalProperties: {
              type: 'component',
              allowsRef: false,
              component: MediaType.MediaType
            }
          }
        },
        {
          name: 'required',
          schema: { type: 'boolean' }
        }
      ]
    }
  }

  static validate (definition: Definition, version?: Version): ValidateResult {
    return super.validate(definition, version, arguments[2])
  }
}
