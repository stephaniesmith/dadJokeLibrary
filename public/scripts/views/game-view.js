'use strict';

(function (module) {

    const gameView = {};
    const answerTemplate = Handlebars.compile($('#answers-template').html());

    gameView.currentQuestion = null;

    gameView.init = () => {
        $('#game-view').show();

        $('#question').empty();
        $('#answers').empty();

        $('#answers').empty();

        const token = window.localStorage.getItem('token');

        fetch(`/questions/voting`, {
            headers: {
                'token' : token,
                'content-type': 'application/json'
            },
            method: 'GET',
            mode: 'cors'
        })
            .then(res => res.json())
            .then(res => {
                loadQuestion(res);
                loadAnswers();
            });

        $('#submitAnswer').off('click').on('click', handleAnswer);
    };
    
    
    gameView.vote = (id, question, emoji, next) => {
        const vote = {
            emoji: emoji,
            question: question,
            answer: id,
            voter: null
        };
        const token = window.localStorage.getItem('token');
        
        fetch(`/votes`, {
            body: JSON.stringify(vote),
            headers: {
                'token' : token,
                'content-type': 'application/json'
            },
            method: 'POST',
            mode: 'cors'
        })
            .then(response => response.json())
            .then(() => {
                $('#answers-form').trigger('reset');
                next();
            })
            .catch(err => {
                console.log(err);
                next();
            });
    };
        
    const loadAnswers = () => {
        $.get( `/answers/all?question=${gameView.currentQuestion._id}`, ( answers ) => {
            answers.forEach(answer => {
                const answerCard = answerTemplate(answer);
                $('#answers').append(answerCard);
                checkVotes(gameView.currentQuestion._id);
            });
        });
    };

    const loadQuestion = (question) => {
        gameView.currentQuestion = question;
        $('#question').append(`<h2>${question.prompt}</h2>`);
    };

    const handleAnswer = event => {
        event.preventDefault();
        const answer = {
            content: $('#answer').val(),
            question: gameView.currentQuestion._id,
            author: null
        };
        const token = window.localStorage.getItem('token');

        fetch(`/answers`, {
            body: JSON.stringify(answer),
            headers: {
                'token' : token,
                'content-type': 'application/json'
            },
            method: 'POST',
            mode: 'cors'
        })
            .then(response => response.json())
            .then(() => {
                location.reload();
                $('#answers-form').trigger('reset');
            })
            .catch(err => {
                console.log(err);
            });
    };

    const checkVotes = () => {
        const token = window.localStorage.getItem('token');

        fetch(`/votes/myVotes`, {
            headers: {
                'token' : token,
            },
            method: 'GET'
        })
            .then( response => response.json())
            .then( ( votes ) => {
                const votesByQuestion = votes.filter(vote => vote.question === gameView.currentQuestion._id);
                votesByQuestion.forEach(vote => {
                    $(`.${vote.emoji}`).removeClass('active').addClass('disabled');
                    $(`.${vote.answer}`).removeClass('active').addClass('disabled');
                });
            });
    };
   
    module.gameView = gameView;

})(window.module);