const expect = require('chai').expect;
const Enforcer = require('../index');
const path = require('path');

const resourcesPath = path.resolve(__dirname, '..', 'test-resources');

describe('documented issues fixes', () => {

    it('issues 39 - cyclic reference toObject', async () => {
        const openApiDocPath = path.resolve(resourcesPath, 'issue-39', 'cyclic_reference.yaml');
        const { error } = await Enforcer(openApiDocPath, { fullResult: true });
        expect(error).to.equal(undefined)
    });

    it('issue 66 - oneOf example undefined value warning', async () => {
        const openApiDocPath = path.resolve(resourcesPath, 'issue-66', 'openapi.yml');
        const { warning } = await Enforcer(openApiDocPath, { fullResult: true });
        expect(warning).to.equal(undefined)
    });

    describe('issue 69 - oneOf additionalProperties = false', () => {
        const def = {
            oneOf: [
                {
                    properties: {
                        one: { type: "string" }
                    },
                    required: [ "one" ],
                    additionalProperties: false,
                    type: "object"
                },
                {
                    properties: {
                        one: { type: "string" },
                        two: { type: "string" }
                    },
                    required: [ "one", "two" ],
                    additionalProperties: false,
                    type: "object"
                }
            ]
        };

        let schema;
        before(() => {
            const result = new Enforcer.v3_0.Schema(def);
            schema = result.value;
        });

        it('can identify schema with one value', () => {
            const [ value, err, warn ] = schema.deserialize({ one: "value" });
            expect(err).to.equal(undefined);
            expect(value).to.deep.equal({ one: 'value' });
        });

        it('can identify schema with two values', () => {
            const [ value, err, warn ] = schema.deserialize({ one: 'one', two: 'two' });
            expect(err).to.equal(undefined);
            expect(value).to.deep.equal({ one: 'one', two: 'two' });
        });

        it('can identify invalid input', () => {
            const [ value, err, warn ] = schema.deserialize({ one: 1 });
            expect(err).to.match(/Expected a string/);
        });

    })

    describe('issue-70 - discriminator mappings must be resolved prior to example validation', () => {

        it('can validate examples with discriminator mappings', async () => {
            const openApiDocPath = path.resolve(resourcesPath, 'issue-70', 'openapi.yml');
            const [ openapi, error, warning ] = await Enforcer(openApiDocPath, { fullResult: true });

            expect(error).to.equal(undefined);
            expect(warning).to.equal(undefined);

            const examples = openapi.paths['/pets/{petId}'].get.responses['200'].content['application/json'].examples;
            expect(examples.cat.value.id).to.be.a('number')
        });

    });

    describe('issue-86 - custom bundler issues', () => {
        let useNew

        before(() => {
            useNew = Enforcer.config.useNewRefParser
            Enforcer.config.useNewRefParser = true
        })

        after(() => {
            Enforcer.config.useNewRefParser = useNew
        })

        it('can produce a valid openapi file', async () => {
            const openApiDocPath = path.resolve(resourcesPath, 'issue-86', 'oas.yaml')
            const [ bundled, error ] = await Enforcer.bundle(openApiDocPath)
            if (error) {
                throw Error(error)
            } else {
                const [, err, warn] = await Enforcer(bundled, {
                    fullResult: true
                })
                if (err) throw Error(err)
            }
        })

    })

    describe('issue-108 - attempting to validate an object without discriminator field results in exception', () => {
        const def = {
            openapi: '3.0.0',
            info: { title: '', version: '' },
            paths: {
                '/': {
                    post: {
                        requestBody: {
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/content' }
                                }
                            }
                        },
                        responses: {
                            200: { description: 'ok' }
                        }
                    }
                }
            },
            components: {
                schemas: {
                    'content.text': {
                        type: 'object',
                        properties: {
                            type: {
                                type: 'string'
                            },
                            content: {
                                type: 'string'
                            }
                        }
                    },
                    'content.file': {
                        type: 'object',
                        properties: {
                            type: {
                                type: 'string'
                            },
                            content: {
                                type: 'string',
                                format: 'byte'
                            }
                        }
                    },
                    content: {
                        oneOf: [
                            { $ref: '#/components/schemas/content.text' },
                            { $ref: '#/components/schemas/content.file' }
                        ],
                        discriminator: {
                            propertyName: 'type',
                            mapping: {
                                text: '#/components/schemas/content.text',
                                file: '#/components/schemas/content.file'
                            }
                        }
                    }
                }
            }
        }

        it('should validate correctly with valid discriminator property name', async () => {
            const [ openapi, error ] = await Enforcer(def, { fullResult: true })
            expect(error).to.equal(undefined)

            const err = openapi.components.schemas.content.validate({
                type: 'text',
                content: 'hello'
            })
            expect(err).to.equal(undefined)
        })

        it('should produce an exception with deserializing invalid discriminator property name', async () => {
            const [ openapi, error ] = await Enforcer(def, { fullResult: true })
            expect(error).to.equal(undefined)

            const [ , err ] = openapi.components.schemas.content.deserialize({
                type: 'audio',
                content: 'hello'
            })
            expect(err).to.match(/Discriminator property "type" as "audio" did not map to a schema/)
        })

        it('should produce an exception with validating invalid discriminator property name', async () => {
            const [ openapi, error ] = await Enforcer(def, { fullResult: true })
            expect(error).to.equal(undefined)

            const err = openapi.components.schemas.content.validate({
                type: 'audio',
                content: 'hello'
            })
            expect(err).to.match(/Discriminator property "type" as "audio" did not map to a schema/)
        })

        it('should produce an error for operation request with invalid discriminator property', async () => {
            const [ openapi ] = await Enforcer(def, { fullResult: true, toString: true, componentOptions: { production: false } });

            const [, err] = openapi.request({
                path: '/',
                method: 'POST',
                body: {
                    type: 'audio',
                    url: 'hello'
                },
            });

            expect(err).to.match(/Discriminator property "type" as "audio" did not map to a schema/);
        })
    })

    describe('issue-118 - incorrectly identifies duplicate paths', () => {

        it('will correctly identify duplicate paths', async () => {
            const [ , err ] = await Enforcer(path.resolve(resourcesPath, 'issue-118/openapi.yml'), { fullResult: true });
            expect(err).to.match(/Equivalent paths are not allowed/)
            expect(err).to.match(/GET \/user\/{userId}/)
            expect(err).to.match(/GET \/user\/{username}/)
        })

    })

});
