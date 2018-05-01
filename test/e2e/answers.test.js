const { assert } = require('chai');
const request = require('./request');
const { dropCollection } = require('./db');
const Answer = require('../../lib/models/Answer');

describe('Answer E2E API', () => {

    let token = null;

    const user = {
        username: 'Mr. Jones',
        password: 'abc'
    };

    let answer1 = {
        content: 'To get to the other side',
    };

    let answer2 = {
        content: 'Because its a stupid chicken',
    };

    const question = {
        prompt: 'Why did the chicken?',
    };

    const checkOk = res => {
        if(!res.ok) throw res.error;
        return res;
    };

    const getAllFields = ({ _id, content, question}) => {
        return {
            _id, content, question
        };
    };

    before(() => dropCollection('users'));
    before(() => dropCollection('answers'));
    before(() => dropCollection('questions'));

    before(() => {
        return request.post('/auth/signup')
            .send(user)
            .then(checkOk)
            .then(( { body }) => {
                user._id = body._id;
                assert.ok(user._id);

                question.user = user._id;
                token = body.token;

                answer1.author = user._id;
                answer2.author = user._id;
            });
    });

    before(() => {
        return request.post('/questions')
            .set('Token', token)
            .send(question)
            .then(checkOk)
            .then(({ body }) => {
                question._id = body._id;
                assert.ok(question._id);

                answer1.question = question._id;
                answer2.question = question._id;
            });
    });

    it('saves an answer', () => {
        return request.post('/answers')
            .set('Token', token)
            .send(answer1)
            .then(checkOk)
            .then(( {body }) => {
                const { _id, __v } = body;
                assert.ok(_id);
                assert.equal(__v, 0);
                assert.deepEqual(body, {
                    _id, __v,
                    ...answer1
                });
                answer1 = body;
            });
    });

    it('gets an answer by id', () => {
        return request.post('/answers')
            .set('Token', token)
            .send(answer2)
            .then(checkOk)
            .then(({ body }) => {
                answer2 = body;
                assert.ok(answer2._id);
                return request.get(`/answers/${answer2._id}`)
                    .set('Token', token)
                    .set('Authorization', 'admin')
                    .then(({ body }) => {
                        assert.deepEqual(body, answer2);
                    });
            });
    });

    it('gets all answers', () => {
        return request.get('/answers')
            .set('Token', token)
            .set('Authorization', 'admin')
            .then(checkOk)
            .then(({ body }) => {
                assert.deepEqual(body, [answer1, answer2].map(getAllFields));
            });
    });

    it('deletes an answer', () => {
        return request.delete(`/answers/${answer2._id}`)
            .set('Token', token)
            .set('Authorization', 'admin')
            .then(() => {
                return Answer.findById(answer2._id);
            })
            .then(found => {
                assert.isNull(found);
            });
    });

    it('returns 404 on get of non-existent id', () => {
        return request.get(`/answers/${answer2._id}`)
            .set('Token', token)
            .set('Authorization', 'admin')
            .then(response => {
                assert.equal(response.status, 404);
                assert.match(response.body.error, new RegExp(answer2._id));
            });
    });
});