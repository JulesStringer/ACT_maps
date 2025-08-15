function extractvariable(properties, variable) {
    var objs = variable.split('.');
    var value = properties;
    objs.forEach(function (obj, i) {
        if (value) {
            value = value[obj];
        }
    });
    return value;
}
function condition_notnull(properties, clause) {
    if (clause.name) {
        if (extractvariable(properties,clause.name) != null) {
            return true;
        }
    }
    return false;
}
function condition_isnull(properties, clause) {
    if (clause.name) {
        if (extractvariable(properties,clause.name) != null) {
            return false;
        }
    }
    return true;
}
function condition_equal(properties, clause) {
    if (clause.name) {
        var v = extractvariable(properties, clause.name);
        if (clause.value != null) {
            if (v == clause.value) {
                return true;
            }
        } else if (clause.other != null) {
            if (v  == extractvalue(properties, clause.other)) {
                return true;
            }
        }
    }
    return false;
}
function condition_notequal(properties, clause) {
    if (clause.name) {
        var v = extractvariable(properties, clause.name);
        if (clause.value !== null) {
            if (v != clause.value) {
                return true;
            }
        } else if (clause.other !== null) {
            if (v != extractvariable(properties, clause.other)) {
                return true;
            }
        }
    }
    return false;
}
function condition_less(properties, clause) {
    if (clause.name) {
        var v = extractvariable(properties, clause.name);
        if (clause.value != null) {
            if (v < clause.value) {
                return true;
            }
        } else if (clause.other != null) {
            if (v < extractvariable(properties, clause.other)) {
                return true;
            }
        }
    }
    return false;
}
function condition_lessequal(properties, clause) {
    if (clause.name) {
        var v = extractvariable(properties, clause.name);
        if (clause.value != null) {
            if (v <= clause.value) {
                return true;
            }
        } else if (clause.other != null) {
            if (v <= extractvariable(properties, clause.other)) {
                return true;
            }
        }
    }
    return false;
}
function condition_greater(properties, clause) {
    if (clause.name) {
        var v = extractvariable(properties, clause.name);
        if (clause.value != null) {
            if (v > clause.value) {
                return true;
            }
        } else if (clause.other != null) {
            if (v > extractvariable(properties, clause.other)) {
                return true;
            }
        }
    }
    return false;
}
function condition_greaterequal(properties, clause) {
    if (clause.name) {
        var v = extractvariable(properties, clause.name);
        if (clause.value != null) {
            if (v >= clause.value) {
                return true;
            }
        } else if (clause.other != null) {
            if (v >= extractvariable(properties, clause.other)) {
                return true;
            }
        }
    }
    return false;
}
function condition_and(properties, clause) {
    var keys = Object.keys(clause);
    var result = true;
    keys.forEach(function (opname, i) {
        if (!condition_evalop(properties, opname, clause[opname])){
            result = false;
            return false;
        }
    });
    return result;
}
function condition_or(properties, clause) {
    var keys = Object.keys(clause);
    var result = false;
    keys.forEach(function (opname, i) {
        if (condition_evalop(properties, opname, clause[opname])){
            result = true;
            return true;
        }
    });
    return result;
}
function condition_between(properties, clause) {
    if (clause.name) {
        var v = extractvariable(properties, clause.name);
        if (clause.min != null && clause.max != null    ) {
            if (v < clause.max && v >= clause.min) {
                return true;
            }
        }
    }
    return false;
}
function condition_evalop(properties, opname, clause) {
    switch (opname) {
        case 'notnull':
            return condition_notnull(properties, clause);
        case 'null':
            return condition_null(properties, clause);
        case 'equal':
            return condition_equal(properties, clause);
        case 'or':
            return condition_or(properties, clause);
        case 'and':
            return condition_and(properties, clause);
        case 'equal':
            return condition_equal(properties, clause);
        case 'notequal':
            return condition_notequal(properties, clause);
        case 'less':
            return condition_less(properties, clause);
        case 'lessequal':
            return condition_lessequal(properties, clause);
        case 'greater':
            return condition_greater(properties, clause);
        case 'greaterequal':
            return condition_greaterequal(properties, clause);
        case 'between':
            return condition_between(properties, clause);
    }
    return false;
}
function condition_evaluate(properties, condition) {
    return condition_evalop(properties, "and", condition);
}
