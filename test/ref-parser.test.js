const Exception = require('../src/exception');
const expect = require('chai').expect;
const RefParser = require('../src/json-schema-ref-parser');
const path = require('path');
const server = require('../test-resources/ref-parser/server');

const resourcesDir = path.resolve(__dirname, '..', 'test-resources', 'ref-parser');

// TODO: add a message to discriminator not found mapping at root document message indicating that experimental parser should be used

describe.only('ref-parser', () => {
    let close;
    let parser;

    before(async () => {
        close = await server()
    });

    beforeEach(() => {
        const p = new RefParser();
        parser = p.dereference.bind(p);
    });

    after(() => {
        close()
    });

    it('can load file', async () => {
        const [ result ] = await parser(path.resolve(resourcesDir, 'People.yml'));
        expect(result).to.haveOwnProperty('Person');
    });

    it('can load from a url', async () => {
        const [ result ] = await parser('http://localhost:18088/People.yml');
        expect(result).to.haveOwnProperty('Person');
    });

    it('can map internal references', async () => {
        const [ result ] = await parser(path.resolve(resourcesDir, 'Pets.yaml'));
        expect(result.Cat.allOf[0]).to.equal(result.Pet);
        expect(result.Dog.allOf[0]).to.equal(result.Pet);
    });

    it('can map external references', async () => {
        const [ result ] = await parser(path.resolve(resourcesDir, 'Household.json'));
        expect(result.People.items['x-key']).to.equal('Person');
        expect(result.Pets.items['x-key']).to.equal('Pet');
    });

    it('can map from intro object', async () => {
        const obj = {
            MyPet: {
                $ref: path.resolve(resourcesDir, './Pets.yaml#/Pet')
            }
        };
        const [ result ] = await parser(obj);
        expect(result.MyPet['x-key']).to.equal('Pet');
    });

    it('can map to root element', async () => {
        const obj = {
            MyPet: {
                $ref: path.resolve(resourcesDir, './Pets.yaml')
            }
        };
        const [ result ] = await parser(obj);
        expect(result.MyPet.Pet['x-key']).to.equal('Pet');
    });

    it('can map from root element', async () => {
        const obj = {
            $ref: path.resolve(resourcesDir, './Pets.yaml')
        };
        const [ result ] = await parser(obj);
        expect(result.Pet['x-key']).to.equal('Pet');
    });

    it('can map from root element file', async () => {
        const [ result ] = await parser(path.resolve(resourcesDir, './FromRoot.yml'));
        expect(result.Pet['x-key']).to.equal('Pet');
    });

    it.only('can handle circular references in same document', async () => {
        const obj = {
            A: {
                title: 'A',
                pair: {
                    $ref: '#/B/title'
                },
            },
            B: {
                title: 'B',
                pair: {
                    $ref: '#/A/title'
                },
            }
        };
        const [ result ] = await parser(obj);
        expect(result.MyPet['x-key']).to.equal('Pet');
    });

    it('can handle circular references in file', async () => {
        const [ result ] = await parser(path.resolve(resourcesDir, './CircleA.yml'));
        expect(result.MyPet['x-key']).to.equal('Pet');
    });

    it('will produce error for missing root file', async () => {
        const [, exception ] = await parser(path.resolve(resourcesDir, 'dne.yml'));
        expect(exception).to.match(/Unable to find referenced file.+dne\.yml$/);
    });

    it('will produce error for non reachable http endpoint', async () => {
        const [, exception ] = await parser('http://localhost:18088/dne.yml');
        expect(exception).to.match(/Unable to load resource.+dne\.yml$/);
    });

    it('will produce exception for missing nested file', async () => {
        const obj = {
            Pet: {
                $ref: path.resolve(resourcesDir, './dne.yml#/Foo')
            }
        };
        const [, exception ] = await parser(obj);
        expect(exception).to.match(/Unable to find referenced file.+dne\.yml$/);
    });

    it('will produce error for existing file with missing resource', async () => {
        const obj = {
            Pet: {
                $ref: path.resolve(resourcesDir, './Pets.yaml#/Dne')
            }
        };
        const [, exception ] = await parser(obj);
        expect(exception).to.match(/Cannot resolve reference: #\/Dne$/);
    });

    it('can look up nodes based on references', async () => {
        const p = new RefParser();
        const [ result ] = await p.dereference(path.resolve(resourcesDir, 'Pets.yaml'));
        p.$refs.get('#/Cat', )
        expect(result.Cat.allOf[0]).to.equal(result.Pet);
        expect(result.Dog.allOf[0]).to.equal(result.Pet);
    });

});