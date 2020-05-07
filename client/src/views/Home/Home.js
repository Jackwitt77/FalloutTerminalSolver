import React, {useEffect, useState} from 'react';
import * as puzzleSolver from "../../puzzleSolver.js"
import {findHighestShareScore, findNextGuess, findShareScores} from "../../puzzleSolver";
import Grid from '@material-ui/core/Grid';
import Container from '@material-ui/core/Container';
import { makeStyles } from '@material-ui/core/styles';
import './Home.css';
const { createWorker, PSM } = require('tesseract.js');
const useStyles = makeStyles(theme => ({
    paper: {
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(3),
    },
    submit: {
        margin: theme.spacing(3, 0, 2),
    },
}));


const ArrayButton = (props) =>
{
    const submit = () =>
    {
        props.submit(props.index);
    };
    return <button disabled = {props.disabled} type = "button" onClick={submit}>Submit</button>
};

const Home = () => {
    const [picture, setPicture] = useState();
    const [words, setWords] = useState(["","","","", "","","","", "","","",""]);
    const [guesses, setGuesses] = useState([]);
    const [likenesses, setLikenesses] = useState([0, 0, 0, 0]);
    const [likenessSubmitted, setLikenessSubmitted] = useState([false, false, false, false]);
    const [password, setPassword] = useState("");

    //all words should be the same length so keep track of this length and show errors for words that don't match it
    const [wordLength, setWordLength] = useState(0);

    //don't show word length error while typing word so keep track of what word is being edited
    const [isBeingEdited, setIsBeingEdited] = useState([false,false,false,false]);

    const classes = useStyles();

    const worker = createWorker({
        langPath: '',
        gzip: false,
        logger: m => console.log(m)
    });

    const findText = async () =>
    {
        debugger;
        await worker.load();
        await worker.loadLanguage('Fallout');
        await worker.initialize('Fallout');
        const { data: { text } } = await worker.recognize(picture);
        console.log(text);
        await worker.terminate();
    };

    const addWord = () =>
    {
        const newWords = [...words];
        newWords.push("");
        setWords(newWords);

        const newEdits = [...isBeingEdited];
        newEdits.push(false);
        setIsBeingEdited(newEdits);
    };
    const removeWord = () =>
    {
        const newWords = [...words];
        newWords.pop();
        setWords(newWords);

        const newEdits = [...isBeingEdited];
        newEdits.pop();
        setIsBeingEdited(newEdits);
    };
    const findCommonWord = () =>
    {
        const commonWord = words[puzzleSolver.findHighestShareScore(puzzleSolver.findShareScores(words))];
        console.log(commonWord);
        const newGuesses = [...guesses];
        newGuesses.push(commonWord);
        setGuesses(newGuesses);
    };
    //main function that handles the entered words changing
    const updateWords = (newValue, index) =>
    {
        //mark every word as not being edited except the one being edited
        const newEdits = [];
        for (let i = 0; i < isBeingEdited.length; i++)
            newEdits.push(false);
        newEdits[index] = true;
        setIsBeingEdited(newEdits);

        const newWords = words.map((item, i) => {
        //loop through newWords and update only the word that is being edited
        if (i === 0)
        {
            //make the word length set to the length of the first word
            setWordLength(words[i].length);
        }
        if (i === index)
        {
            return newValue;
        }
        else
        {
            return words[i];
        }
    });
        setWords(newWords);
    };
    const updateLikenesses = (newValue, index) =>
    {
        const newLikenesses = likenesses.map((item, i) => {
            //loop through newWords and update only the word that is being edited
            if (i === index)
            {
                return parseInt(newValue);
            }
            else
            {
                return likenesses[i];
            }
        });
        setLikenesses(newLikenesses);
    };
    const submitLikeness = (index) =>
    {
        const newLikenessSubmitted = [...likenessSubmitted];
        newLikenessSubmitted[index] = true;
        setLikenessSubmitted(newLikenessSubmitted);
        const possibleGuesses = findNextGuess(guesses, likenesses, words);
        if (possibleGuesses.length === 1)
        {
            //only one guess left so it must be the password
            //password found = true
            setPassword(possibleGuesses[0]);
            return;
        }
        const bestGuess = words[findHighestShareScore(findShareScores(possibleGuesses))];
        const newGuesses = [...guesses];
        newGuesses.push(bestGuess);
        setGuesses(newGuesses);
    };
    const uploadPicture = (event) =>
    {
        setPicture(event.target.files[0]);
    };

    useEffect(() =>
    {
        if (picture)
        {
            findText();
        }
    });
    return (
        <p className= "App">
            <Grid container justify = {"center"} spacing = {0}>
                <Grid>
        <Container component="main" maxWidth= "md">
        <div>
            <h3  style = {{color: '#00ff10'}}>Upload Image of terminal</h3>
            <input type = "file" accept = "image/png, image/jpg" onChange={uploadPicture}/>
            <div>{password ? <h1 style = {{color: '#00ff10'}}>{"Password found! It's " + password}</h1> : null}</div>
            <h3  style = {{color: '#00ff10'}}>Or enter words manually</h3>
            {words.map((item, index) =>
            (
                //allows each WordInput component to have an index
                <Grid xs = {12}>
                    <label  style = {{color: '#00ff10'}}>
                    {"Word " + (index+1)}
                        <WordInput updateWord = {updateWords} index = {index} />
                    </label>
                        {!isBeingEdited[index] && words[index].length !== 0
                        && words[index].length < wordLength && index !==0 ?
                            <span style = {{color: '#FF0000'}}>Too short</span> : null}

                        {!isBeingEdited[index] && words[index].length !== 0
                            && words[index].length > wordLength && index !==0 ?
                            <span style = {{color: '#FF0000'}}>Too long</span> : null}

                </Grid>
            ))}
            <Grid>
             <button  style = {{color: '#00ff10'}} onClick={findCommonWord}>Find word with most letters in common</button>
                <button  style = {{color: '#00ff10'}} onClick = {addWord}>Add word</button>
                <button  style = {{color: '#00ff10'}} onClick={removeWord}>Remove word</button>
            </Grid>
            <div>
                {guesses.map((item, index) =>
                    (
                        //allows each WordInput component to have an index
                        <form style = {{color: '#00ff10'}}>
                            {"Click "+ guesses[index] + " and submit its likeness here:"}
                            <label>
                                <WordInput disabled = {likenessSubmitted[index]} updateWord = {updateLikenesses} index = {index} />
                            </label>
                            <ArrayButton disabled = {likenessSubmitted[index]} submit = {submitLikeness} index = {index}/>
                        </form>
                    ))}
            </div>
        </div>
        </Container>
                </Grid>
            <Grid>
                <Container>
                    <h3 style = {{color: '#00ff10'}}>to the side</h3>
                </Container>
            </Grid>
            </Grid>
        </p>
    );
};

const WordInput = (props) =>
{
    const updateWord = (e) =>
    {
        //update the word's state using the text entered and its index
        props.updateWord(e.target.value, props.index);
    };
    return <input disabled = {props.disabled} onChange = {updateWord} type = "text"/>
};

export default Home;
