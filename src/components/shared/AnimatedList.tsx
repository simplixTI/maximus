import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedListProps {
  children: ReactNode[];
  staggerDelay?: number;
  className?: string;
}

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

const AnimatedList = ({ children, className }: AnimatedListProps) => (
  <motion.div variants={container} initial="hidden" animate="show" className={className}>
    {children.map((child, i) => (
      <motion.div key={i} variants={item}>
        {child}
      </motion.div>
    ))}
  </motion.div>
);

export { AnimatedList, item as animatedItemVariants };
export default AnimatedList;
