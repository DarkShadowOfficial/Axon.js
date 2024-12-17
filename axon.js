class ClusteringModel {
  constructor() {
    this.data = [];
    this.clusters = {};
    this.distances = {};
  }
  train(data) {
    this.data = this.data.concat(data);
    for (let j = 0; j < this.data.length; j++) {
      let i = this.data[j];
      if (this.clusters[i.output]) {
        this.clusters[i.output].push(i);
      } else {
        this.clusters[i.output] = [i];
      }
    }
    for (let n of Object.getOwnPropertyNames(this.clusters)) {
      let maxdistance = 0;
      for (let i = 0; i < this.clusters[n].length; i++) {
        for (let j = i; j < this.clusters[n].length; j++) {
          let obj1 = this.clusters[n][i];
          let obj2 = this.clusters[n][j];
          let distance = 0;
          for (let f = 0; f < obj1.input.length; f++) {
            distance += (obj1.input[f] - obj2.input[f]) ** 2;
          }
          distance = distance ** 0.5;
          if (distance > maxdistance) {
            maxdistance = distance;
          }
        }
      }
      this.distances[n] = maxdistance;
    }
  }
  test(input) {
    let ds = {};
    for (let n of Object.getOwnPropertyNames(this.distances)) {
      let mindistance = this.distances[n] + 1;
      for (let i = 0; i < this.clusters[n].length; i++) {
        let obj = this.clusters[n][i];
        let distance = 0;
        for (let f = 0; f < input.length; f++) {
          distance += (obj.input[f] - input[f]) ** 2;
        }
        distance = distance ** 0.5;
        if (distance < mindistance) mindistance = distance;
      }
      ds[n] = mindistance;
    }
    let final;
    for (let i of Object.getOwnPropertyNames(ds)) {
      if (ds[i] <= this.distances[i]) {
        if (final == undefined) {
          final = i;
        } else {
          if (ds[i] < ds[final]) {
            final = i;
          }
        }
      }
    }
    if (final == undefined) {
      return { output: undefined, confidence: 1, input: input };
    }
    return { output: final, confidence: 1 - ds[final] / this.distances[final] };
  }
  #distance(point1, point2) {
    let d = 0;
    for (let i = 0; i < point1.length; i++) {
      d += (point1[i] - point2[i]) ** 2;
    }
    return d ** 0.5;
  }
  classify(datapoints, n_groups) {
    let distances = {};
    let dists = [];
    let data = [];
    let groups = {};
    let left = datapoints.length;
    let lengths = [];
    for (let i = 0; i < n_groups - 1; i++) {
      let l = Math.ceil(left / n_groups);
      groups["group" + (i + 1)] = [];
      lengths.push(l);
      left -= l;
    }
    groups["group" + n_groups] = [];
    lengths.push(left);
    for (let i = 0; i < datapoints.length; i++) {
      for (let j = i + 1; j < datapoints.length; j++) {
        if (distances[this.#distance(datapoints[i], datapoints[j])]) {
          if (
            typeof distances[this.#distance(datapoints[i], datapoints[j])][0] ==
            "number"
          ) {
            distances[this.#distance(datapoints[i], datapoints[j])] = [
              distances[this.#distance(datapoints[i], datapoints[j])],
              [i, j],
            ];
          } else {
            distances[this.#distance(datapoints[i], datapoints[j])].push([
              i,
              j,
            ]);
          }
        } else {
          distances[this.#distance(datapoints[i], datapoints[j])] = [i, j];
        }
        dists.push(this.#distance(datapoints[i], datapoints[j]));
      }
    }
    for (let i = 0; i < dists.length; i++) {
      for (let j = i + 1; j < dists.length; j++) {
        if (dists[j] < dists[i]) {
          let swap = dists[j];
          dists[j] = dists[i];
          dists[i] = swap;
        }
      }
    }
    for (let t in dists) {
      for (let i in distances[dists[t]]) {
        let c = distances[dists[t]];
        for (let e of Object.getOwnPropertyNames(groups)) {
          if (groups[e].length < lengths[parseInt(e.charAt(e.length - 1))]) {
            if (groups[e].length == 0) {
              if (typeof c[0] == "number") {
                groups[e] = c;
                t++;
                break;
              } else {
                groups[e] = c[i];
                t++;
                break;
              }
            } else {
              for (let j in c) {
                if (typeof c[j] == "number") {
                  if (c[j] in groups[e]) {
                    groups[e] = groups[e].concat(c);
                  }
                  t++;
                } else {
                  for (let k in c[j]) {
                    if (c[j][k] in groups[e]) {
                      groups[e] = groups[e].concat(c[j]);
                    }
                    t++;
                  }
                }
              }
            }
            groups[e] = [...new Set(groups[e])];
          }
        }
      }
    }
    let range = [];
    for (let i = 0; i < datapoints.length; i++) {
      range.push(i);
    }
    for (let e of Object.getOwnPropertyNames(groups)) {
      for (let i in range) {
        if (groups[e].indexOf(range[i]) > -1) {
          range.splice(i, 1);
        }
      }
    }
    let a = [];
    for (let e of Object.getOwnPropertyNames(groups)) {
      a.push(groups[e]);
    }
    a = [...new Set(a)];
    a[a.length - 1] = range;
    for (let i in a) {
      groups[`group${parseInt(i) + 1}`] = a[i];
    }
    for (let i of Object.getOwnPropertyNames(groups)) {
      groups[i] = [...new Set(groups[i])];
      for (let j in groups[i]) {
        data.push({ input: datapoints[groups[i][j]], output: i });
      }
    }
    return data;
  }
}
class RegressionModel {
  constructor() {
    this.coeffs = [];
  }
  #deltas(list) {
    let d = [];
    for (let i = 1; i < list.length; i++) {
      d.push({
        input: (list[i].input + list[i - 1].input) / 2,
        output:
          (list[i].output - list[i - 1].output) /
          (list[i].input - list[i - 1].input),
      });
    }
    return d;
  }
  train(data) {
    let c = [];
    let d = [];
    let dat = [...data];
    for (let i in data) {
      d.push(this.#deltas(dat));
      let x = 0;
      for (let i in d[d.length - 1]) {
        if (d[d.length - 1][i].output != 0) {
          x = d[d.length - 1][i].output;
        }
      }
      if (x == 0) {
        break;
      }
      dat = this.#deltas(dat);
    }
    let deg = d.length;
    for (let i = 0; i < deg; i++) {
      c.push(Math.random());
    }
    let error = 0;
    let oldError = 10;
    for (let n = 0; n < 5000; n++) {
      for (let i in data) {
        let p = 0;
        for (let j in c) {
          p += c[j] * data[i].input ** j;
        }
        error += (p - data[i].output) ** 2;
      }
      error /= data.length;
      if (error < oldError) {
        c = c.map((x) => x + (error * (Math.random() - 0.5)) / c.length);
        oldError = error;
      }
      error = 0;
    }
    this.coeffs = c;
  }
  test(input) {
    let res = 0;
    for (let i = 0; i < this.coeffs.length; i++) {
      res += this.coeffs[i] * input ** i;
    }
    return res;
  }
}
