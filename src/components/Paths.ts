import { OASComponent, initializeData, SchemaObject, SpecMap, Version, ValidateResult } from './'
import { addExceptionLocation, yes } from '../util'
import * as E from '../Exception/methods'
import * as PathItem from './PathItem'
import { lookup } from '../loader'

export interface Definition {
  [pathOrExtension: string]: PathItem.Definition | any
}

export class Paths extends OASComponent {
  [pathOrExtension: string]: PathItem.PathItem | any

  constructor (definition: Definition, version?: Version) {
    const data = initializeData('constructing Paths object', definition, version, arguments[2])
    super(data)
  }

  static get spec (): SpecMap {
    return {
      '2.0': 'http://spec.openapis.org/oas/v2.0#paths-object',
      '3.0.0': 'http://spec.openapis.org/oas/v3.0.0#paths-object',
      '3.0.1': 'http://spec.openapis.org/oas/v3.0.1#paths-object',
      '3.0.2': 'http://spec.openapis.org/oas/v3.0.2#paths-object',
      '3.0.3': 'http://spec.openapis.org/oas/v3.0.3#paths-object'
    }
  }

  static schemaGenerator (): SchemaObject {
    return {
      type: 'object',
      allowsSchemaExtensions: yes,
      after ({ definition, exception }, def) {
        const paths = Object.keys(definition)
        const includesTrailingSlashes: string[] = []
        const omitsTrainingSlashes: string[] = []

        // no paths defined
        if (paths.length === 0) {
          const noPathsDefined = E.noPathsDefined()
          addExceptionLocation(noPathsDefined, lookup(def, 'paths'))
          exception.message(noPathsDefined)
        }

        paths.forEach((key: string) => {
          if (key !== '/') {
            if (key[key.length - 1] === '/') {
              includesTrailingSlashes.push(key)
            } else {
              omitsTrainingSlashes.push(key)
            }
          }
        })

        // inconsistent path endings
        if (includesTrailingSlashes.length > 0 && omitsTrainingSlashes.length > 0) {
          const pathEndingsInconsistent = E.pathEndingsInconsistent(includesTrailingSlashes, omitsTrainingSlashes)
          paths.forEach((path: string) => {
            addExceptionLocation(pathEndingsInconsistent, lookup(definition, path, 'key'))
          })
          exception.message(pathEndingsInconsistent)
        }
      },
      additionalProperties: {
        type: 'component',
        allowsRef: false,
        component: PathItem.PathItem
      }
    }
  }

  static validate (definition: Definition, version?: Version): ValidateResult {
    return super.validate(definition, version, arguments[2])
  }
}
