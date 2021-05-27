import { OASComponent, initializeData, SchemaObject, SpecMap, ValidateResult, Version } from './'
import { yes } from '../util'
import * as E from '../Exception/methods'
import rx from '../rx'

export interface Definition {
  [extension: string]: any
  name?: string
  url?: string
  email?: string
}

export class Contact extends OASComponent {
  readonly [extension: string]: any
  readonly email?: string
  readonly name?: string
  readonly url?: string

  constructor (definition: Definition, version?: Version) {
    const data = initializeData('constructing Contact object', definition, version, arguments[2])
    super(data)
  }

  static get spec (): SpecMap {
    return {
      '2.0': 'http://spec.openapis.org/oas/v2.0#contact-object',
      '3.0.0': 'http://spec.openapis.org/oas/v3.0.0#contact-object',
      '3.0.1': 'http://spec.openapis.org/oas/v3.0.1#contact-object',
      '3.0.2': 'http://spec.openapis.org/oas/v3.0.2#contact-object',
      '3.0.3': 'http://spec.openapis.org/oas/v3.0.3#contact-object'
    }
  }

  static schemaGenerator (): SchemaObject {
    return {
      type: 'object',
      allowsSchemaExtensions: yes,
      properties: [
        {
          name: 'name',
          schema: { type: 'string' }
        },
        {
          name: 'url',
          schema: {
            type: 'string',
            after (data, component) {
              const { definition, exception, reference } = data
              if (!rx.url.test(definition)) {
                exception.message(E.invalidUrl(component['x-enforcer'], reference, definition))
              }
            }
          }
        },
        {
          name: 'email',
          schema: {
            type: 'string',
            after (data, component) {
              const { definition, exception, reference } = data
              if (!rx.email.test(definition)) {
                exception.message(E.invalidEmail(component['x-enforcer'], reference, definition))
              }
            }
          }
        }
      ]
    }
  }

  static validate (definition: Definition, version?: Version): ValidateResult {
    return super.validate(definition, version, arguments[2])
  }
}
