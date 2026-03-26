const buildChatRoom = (userA, userB) => [String(userA), String(userB)].sort().join(':');

module.exports = {
  buildChatRoom,
};
