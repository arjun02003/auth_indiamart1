"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRouteParam = void 0;
const getRouteParam = (param) => {
    if (Array.isArray(param))
        return param[0];
    return param;
};
exports.getRouteParam = getRouteParam;
//# sourceMappingURL=express.js.map