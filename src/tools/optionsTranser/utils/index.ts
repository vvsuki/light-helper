export function cloneDeep<T>(value: T): T {
    // 处理基本类型和null
    if (value === null || typeof value !== 'object') {
        return value;
    }

    // 处理日期对象
    if (value instanceof Date) {
        return new Date(value.getTime()) as any;
    }

    // 处理正则表达式
    if (value instanceof RegExp) {
        return new RegExp(value.source, value.flags) as any;
    }

    // 处理数组
    if (Array.isArray(value)) {
        return value.map(item => cloneDeep(item)) as any;
    }

    // 处理普通对象
    if (value instanceof Object) {
        const cloned: any = {};
        Object.entries(value).forEach(([key, val]) => {
            cloned[key] = cloneDeep(val);
        });
        return cloned;
    }

    return value;
}

export const isObject = (obj: any) => {
    return typeof obj === 'object' && obj !== null;
}
