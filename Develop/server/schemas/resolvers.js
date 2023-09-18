const { AuthenticationError } = require('apollo-server-express');

const { User } = require('../models');

const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id }).select(
                    '__v =password'
                );
                return userData;
            }
            throw new AuthenticationError('Not currently logged in');
        },
    },

    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user };
        },
// logging in for the user as well as authenticating the email and password used for the login 
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('The information provided is incorrect. Please try again!');
            }

            const authPassword = await user.isCorrectPassword(password);

            if (!authPassword) {
                throw new AuthenticationError('The information provided is incorrect. Please try again!')
            }

            const token = signToken(user);
            return { token, user };
        },
        // saving a book to the users profile
        saveBook: async (parent, { bookData }, context ) => {
            if (context.user) {
                const updatedUser = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $push: { savedBooks: bookData } },
                    { new: true },
                );
                return updatedUser;
            }

            throw new AuthenticationError('To save a book you need to first log in. Thanks!')
        },
// remove book from saved
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: {bookID } } },
                    { new: true },
                );

                return updatedUser;
            }

            throw new AuthenticationError('To complete this action you must be logged in! Thanks!');
        },
    },
};

module.exports = resolvers;

