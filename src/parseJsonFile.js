const jsonfile = require("jsonfile");

let DIR =
  "/Users/wentao.kong/Desktop/statistic/OD/waymo相关数据导出结果/data_car_v3/1989004381916820_data.json";

function parse(file, cb) {
  jsonfile
    .readFile(file)
    .then((list) => {
      let root = {};
      for (let i = 0; i < list.length; i++) {
        let bag = list[i];
        let counter = root[bag.labeler] || {
          file: file,
          labeler: bag.labeler,
          projectUuid: bag.projectUuid,
          labelVendor: bag.labelVendor,
          qualityInspector: bag.qualityInspector,
          group: 0,
          car_rect5: 0,
        };
        frames = bag.data;
        frames.forEach((f) => {
          let arr = f.labeled.latestResult.objects;
          arr.forEach((o) => {
            if (o.type == "rectangle" && o.annotationClass == "car_rect5") {
              counter.car_rect5 += 1;
            } else if (o.type == "group") {
              counter.group += 1;
            }
          });
        });
        root[bag.labeler] = counter;
      }
      // console.dir(root);
      cb && cb(root);
    })
    .catch((error) => {
      cb && cb(null);
    });
}

// parse(DIR);
module.exports = parse;
