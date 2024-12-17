# Axon.js
A Machine Learning model in JavaScript for classification and regression.

## Documentation
First, import Axon.js

#### Classification
1. Initialize model: `let model = new ClusteringModel();`
2. Train model:
```
model.train([...]);
/*
Each data point should be in the format of {input: [inputs], output: group that point is classified as}
*/
```
3. Test model:
```
let o = model.test(test input);
/*
'o' is an object with 2-3 properties: 'output', 'confidence', and sometimes 'input'.
Output is the classification, which can be undefined, in which case the 'input' property would return the input the user entered.
Confidence is on a range of 0-1, where 1 is 100% confident in its answer and 0 is 0%.
*/
```

An added feature is the model can also receive an array of only inputs, and group items together. Then, it will return a list of the inputs with what it believes should be their output (which will be 'group#'). This array will be compatible to directly pass into the train() method, so that the model can effectively predict the data, then train itself on the prediction, allowing for more autonomy.

```
let inputs = [
  ...
]
let classifications = model.classify(inputs);
model.train(classifications);
```

#### Regression
