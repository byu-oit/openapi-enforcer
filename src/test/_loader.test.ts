import { load, lookup } from '../loader'
import { expect } from 'chai'
import path from 'path'
import fs from 'fs'

const resources = path.resolve(__dirname, '..', '..', 'test-resources', 'loader')

describe('loader and lookup', () => {
  describe('json', () => {
    it('can load a valid json file', async function () {
      const filePath = path.resolve(resources, 'all-types.json')
      const object = await load(filePath)
      const json = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      expect(object).to.deep.equal(json)
    })

    it('will produce errors for an invalid json file', async function () {
      const filePath = path.resolve(resources, 'invalid.json')
      let count = 0
      try {
        await load(filePath)
      } catch (e) {
        count++
      }
      expect(count).to.equal(1)
    })

    it('can correctly locate an array', async function () {
      const object = await load(path.resolve(resources, 'all-types.json'))
      const result = lookup(object.array)
      if (result === undefined) throw Error('Should have found reference')

      expect(result.start.line).to.equal(2)
      expect(result.start.column).to.equal(12)
      expect(result.end.line).to.equal(2)
      expect(result.end.column).to.equal(15)
    })

    it('can correctly locate an array index', async function () {
      const object = await load(path.resolve(resources, 'all-types.json'))
      const result = lookup(object.array, 0)
      if (result === undefined) throw Error('Should have found reference')

      expect(result.start.line).to.equal(2)
      expect(result.start.column).to.equal(13)
      expect(result.end.line).to.equal(2)
      expect(result.end.column).to.equal(14)
    })

    it('can correctly locate an object property', async function () {
      const object = await load(path.resolve(resources, 'all-types.json'))
      const result = lookup(object, 'boolean')
      if (result === undefined) throw Error('Should have found reference')

      expect(result.start.line).to.equal(3)
      expect(result.start.column).to.equal(3)
      expect(result.end.line).to.equal(3)
      expect(result.end.column).to.equal(18)
    })

    it('can correctly locate an object property key', async function () {
      const object = await load(path.resolve(resources, 'all-types.json'))
      const result = lookup(object, 'boolean', 'key')
      if (result === undefined) throw Error('Should have found reference')

      expect(result.start.line).to.equal(3)
      expect(result.start.column).to.equal(3)
      expect(result.end.line).to.equal(3)
      expect(result.end.column).to.equal(12)
    })

    it('can correctly locate an object property value', async function () {
      const object = await load(path.resolve(resources, 'all-types.json'))
      const result = lookup(object, 'boolean', 'value')
      if (result === undefined) throw Error('Should have found reference')

      expect(result.start.line).to.equal(3)
      expect(result.start.column).to.equal(14)
      expect(result.end.line).to.equal(3)
      expect(result.end.column).to.equal(18)
    })
  })

  describe('yaml', () => {
    it('can load a valid yaml file', async function () {
      const result = await load(path.resolve(resources, 'all-types.yaml'))
      // console.log(result.value)
      console.log(lookup(result, 'boolean'))
      console.log(lookup(result, 'boolean', 'key'))
      console.log(lookup(result, 'boolean', 'value'))
    })

    it('will produce errors for an invalid yaml file', async function () {
      const filePath = path.resolve(resources, 'invalid.yml')
      let count = 0
      try {
        await load(filePath)
      } catch (e) {
        count++
      }
      expect(count).to.equal(1)
    })

    it('can correctly locate an array', async function () {
      const object = await load(path.resolve(resources, 'all-types.yaml'))
      const result = lookup(object.array)
      if (result === undefined) throw Error('Should have found reference')

      expect(result.start.line).to.equal(2)
      expect(result.start.column).to.equal(3)
      expect(result.end.line).to.equal(3)
      expect(result.end.column).to.equal(1)
    })

    it('can correctly locate an array index', async function () {
      const object = await load(path.resolve(resources, 'all-types.yaml'))
      const result = lookup(object.array, 0)
      if (result === undefined) throw Error('Should have found reference')

      expect(result.start.line).to.equal(2)
      expect(result.start.column).to.equal(5)
      expect(result.end.line).to.equal(2)
      expect(result.end.column).to.equal(6)
    })

    it('can correctly locate an object property', async function () {
      const object = await load(path.resolve(resources, 'all-types.yaml'))
      const result = lookup(object, 'boolean')
      if (result === undefined) throw Error('Should have found reference')

      expect(result.start.line).to.equal(3)
      expect(result.start.column).to.equal(1)
      expect(result.end.line).to.equal(3)
      expect(result.end.column).to.equal(14)
    })

    it('can correctly locate an object property key', async function () {
      const object = await load(path.resolve(resources, 'all-types.yaml'))
      const result = lookup(object, 'boolean', 'key')
      if (result === undefined) throw Error('Should have found reference')

      expect(result.start.line).to.equal(3)
      expect(result.start.column).to.equal(1)
      expect(result.end.line).to.equal(3)
      expect(result.end.column).to.equal(8)
    })

    it('can correctly locate an object property value', async function () {
      const object = await load(path.resolve(resources, 'all-types.yaml'))
      const result = lookup(object, 'boolean', 'value')
      if (result === undefined) throw Error('Should have found reference')

      expect(result.start.line).to.equal(3)
      expect(result.start.column).to.equal(10)
      expect(result.end.line).to.equal(3)
      expect(result.end.column).to.equal(14)
    })
  })
})