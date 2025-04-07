const trackedStarters = [
    'CREATE DEFINER',
    'CREATE PROCEDURE'
];

const singleLineStarters = [
    'DROP',
    'INSERT',
    'UPDATE',
    'DELETE',
    'CREATE INDEX',
    'ALTER',
    'CREATE TABLE'
];

const splitStatements = (sql) => {
    const compactedSql = sql.replace(/\s+/g, ' ').trim();
    const words = compactedSql.toUpperCase().split(' ');
    const statements = [];

    let currentStatement = [];
    let beginDepth = 0;
    let endDepth = 0;
    for (let i = 0; i < words.length; i += 1) {
        const word = words[i];
        if (!currentStatement.length) {
            currentStatement.push(word);
            continue;
        }
        const firstLine = `${currentStatement[0]} ${currentStatement[1]}`;
        if (firstLine.startsWith(trackedStarters[0]) || firstLine.startsWith(trackedStarters[1])) {
            // track begin and end;
            if (currentStatement.length === 2) {
                // seek to first begin
                const firstBegin = words.slice(i).findIndex(w => w.includes('BEGIN'));
                currentStatement = [...currentStatement, ...words.slice(i, i + firstBegin + 1)];
                beginDepth += 1;
                i += firstBegin;
                continue;
            }

            if (word.includes('BEGIN')) {
                beginDepth++;
            } else if (
                (word === 'END' || word === 'END;') &&
                words[i + 1] !== 'IF' &&
                words[i + 1] !== 'IF;'
                // words[i + 1] !== ')'
            ) {
                endDepth++;
            }
            currentStatement.push(word);
            console.log(beginDepth, endDepth);
            if (beginDepth === endDepth) {
                statements.push(currentStatement.join(' ').trim());
                currentStatement = [];
                beginDepth = 0;
                endDepth = 0;
            }
        } else if (word.includes(';') || i === words.length - 1) {
            currentStatement.push(word);
            statements.push(currentStatement.join(' ').trim());
            currentStatement = [];
        } else {
            currentStatement.push(word);
        }
    }
    return statements;
}

module.exports = {
    splitStatements
}
